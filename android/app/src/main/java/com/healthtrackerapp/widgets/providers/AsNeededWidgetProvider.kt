package com.healthtrackerapp.widgets.providers

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.healthtrackerapp.R
import com.healthtrackerapp.widgets.WidgetActionReceiver
import com.healthtrackerapp.widgets.services.AsNeededWidgetService

class AsNeededWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { updateWidget(context, appWidgetManager, it) }
    }

    companion object {
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, AsNeededWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            ids.forEach { updateWidget(context, manager, it) }
            manager.notifyAppWidgetViewDataChanged(ids, R.id.widget_as_needed_list)
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_as_needed)

            val svcIntent = Intent(context, AsNeededWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
                data = android.net.Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
            }
            views.setRemoteAdapter(R.id.widget_as_needed_list, svcIntent)

            val clickIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val clickPending = PendingIntent.getActivity(
                context,
                201,
                clickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_as_needed, clickPending)

            val actionIntent = Intent(context, WidgetActionReceiver::class.java).apply {
                setPackage(context.packageName)
            }
            val actionPending = PendingIntent.getBroadcast(
                context,
                202,
                actionIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_as_needed_list, actionPending)

            manager.updateAppWidget(widgetId, views)
        }
    }
}
