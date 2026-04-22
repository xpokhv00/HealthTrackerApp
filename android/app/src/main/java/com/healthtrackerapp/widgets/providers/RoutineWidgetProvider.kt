package com.healthtrackerapp.widgets.providers

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.healthtrackerapp.R
import com.healthtrackerapp.widgets.WidgetActionReceiver
import com.healthtrackerapp.widgets.WidgetConstants
import com.healthtrackerapp.widgets.WidgetStorage
import com.healthtrackerapp.widgets.services.RoutineWidgetService

class RoutineWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { updateWidget(context, appWidgetManager, it) }
    }

    companion object {
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, RoutineWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            ids.forEach { updateWidget(context, manager, it) }
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_routine)
            val items = WidgetStorage.getRoutineItems(context)

            val missed = items.filter { it.status == "missed" }
            val pending = items.filter { it.status == "pending" }
            val taken = items.filter { it.status == "taken" }

            val hasAnyData = missed.isNotEmpty() || pending.isNotEmpty() || taken.isNotEmpty()
            views.setViewVisibility(R.id.section_empty, if (hasAnyData) View.GONE else View.VISIBLE)

            // ACTION REQUIRED section — show first missed item
            if (missed.isNotEmpty()) {
                val item = missed[0]
                views.setViewVisibility(R.id.section_action_required, View.VISIBLE)
                views.setTextViewText(R.id.missed_name, item.name)
                views.setTextViewText(R.id.missed_meta, "${item.dosage} · ${item.time}")

                val rescuePending = PendingIntent.getBroadcast(
                    context,
                    (102 + widgetId * 10 + 1),
                    Intent(context, WidgetActionReceiver::class.java).apply {
                        setPackage(context.packageName)
                        action = WidgetConstants.ACTION_TAKE_ROUTINE
                        putExtra(WidgetConstants.EXTRA_ITEM_ID, item.id)
                    },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.btn_rescue, rescuePending)
            } else {
                views.setViewVisibility(R.id.section_action_required, View.GONE)
            }

            // NEXT UP section — show first pending item
            if (pending.isNotEmpty()) {
                val item = pending[0]
                views.setViewVisibility(R.id.section_next_up, View.VISIBLE)
                views.setViewVisibility(R.id.timeline_line, View.VISIBLE)
                views.setTextViewText(R.id.next_name, item.name)
                views.setTextViewText(R.id.next_meta, "${item.dosage} · ${item.time}")
                views.setTextViewText(R.id.next_countdown, formatCountdown(item.time))
                views.setTextViewText(R.id.btn_take_next, "TAKE AT ${item.time}")

                val takePending = PendingIntent.getBroadcast(
                    context,
                    (102 + widgetId * 10 + 2),
                    Intent(context, WidgetActionReceiver::class.java).apply {
                        setPackage(context.packageName)
                        action = WidgetConstants.ACTION_TAKE_ROUTINE
                        putExtra(WidgetConstants.EXTRA_ITEM_ID, item.id)
                    },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.btn_take_next, takePending)
            } else {
                views.setViewVisibility(R.id.section_next_up, View.GONE)
                views.setViewVisibility(R.id.timeline_line, View.GONE)
            }

            // DONE TODAY section — scrollable ListView via RemoteViewsService
            if (taken.isNotEmpty()) {
                views.setViewVisibility(R.id.section_done_today, View.VISIBLE)

                val hasActionSections = missed.isNotEmpty() || pending.isNotEmpty()
                val activeListId = if (hasActionSections) R.id.done_list else R.id.done_list_tall
                val inactiveListId = if (hasActionSections) R.id.done_list_tall else R.id.done_list
                views.setViewVisibility(activeListId, View.VISIBLE)
                views.setViewVisibility(inactiveListId, View.GONE)

                val serviceIntent = Intent(context, RoutineWidgetService::class.java).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                }
                views.setRemoteAdapter(activeListId, serviceIntent)
                manager.notifyAppWidgetViewDataChanged(widgetId, activeListId)
            } else {
                views.setViewVisibility(R.id.section_done_today, View.GONE)
            }

            // Tap whole widget to open app
            val clickIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val clickPending = PendingIntent.getActivity(
                context,
                101,
                clickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_routine, clickPending)

            manager.updateAppWidget(widgetId, views)
        }

        private fun formatCountdown(scheduledTime: String): String {
            return try {
                val parts = scheduledTime.split(":")
                val h = parts[0].toInt()
                val m = if (parts.size > 1) parts[1].toInt() else 0
                val now = java.util.Calendar.getInstance()
                val nowMinutes = now.get(java.util.Calendar.HOUR_OF_DAY) * 60 + now.get(java.util.Calendar.MINUTE)
                val targetMinutes = h * 60 + m
                val diff = targetMinutes - nowMinutes
                if (diff <= 0) return "Now"
                val dh = diff / 60
                val dm = diff % 60
                if (dh > 0) "${dh}h ${dm}m" else "${dm}m"
            } catch (e: Exception) {
                scheduledTime
            }
        }
    }
}
