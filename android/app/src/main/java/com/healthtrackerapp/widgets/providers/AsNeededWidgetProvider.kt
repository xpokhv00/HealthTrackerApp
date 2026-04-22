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
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_as_needed)
            val items = WidgetStorage.getAsNeededItems(context)

            val ready = items.filter { it.available }
            val cooldown = items.filter { !it.available && it.availableInText != "Daily limit reached" }

            // READY section
            if (ready.isNotEmpty()) {
                views.setViewVisibility(R.id.section_ready, View.VISIBLE)

                val readyCards = listOf(
                    Triple(R.id.ready_card_1, R.id.ready_name_1, R.id.ready_meta_1),
                    Triple(R.id.ready_card_2, R.id.ready_name_2, R.id.ready_meta_2),
                    Triple(R.id.ready_card_3, R.id.ready_name_3, R.id.ready_meta_3),
                    Triple(R.id.ready_card_4, R.id.ready_name_4, R.id.ready_meta_4),
                )
                val readyBtns = listOf(R.id.ready_btn_1, R.id.ready_btn_2, R.id.ready_btn_3, R.id.ready_btn_4)

                readyCards.forEachIndexed { index, (cardId, nameId, metaId) ->
                    if (index < ready.size) {
                        val item = ready[index]
                        views.setViewVisibility(cardId, View.VISIBLE)
                        views.setTextViewText(nameId, item.name)
                        views.setTextViewText(metaId, item.dosage)

                        val takePending = PendingIntent.getBroadcast(
                            context,
                            (202 + widgetId * 20 + index),
                            Intent(context, WidgetActionReceiver::class.java).apply {
                                setPackage(context.packageName)
                                action = WidgetConstants.ACTION_TAKE_AS_NEEDED
                                putExtra(WidgetConstants.EXTRA_ITEM_ID, item.id)
                            },
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        )
                        views.setOnClickPendingIntent(readyBtns[index], takePending)
                    } else {
                        views.setViewVisibility(cardId, View.GONE)
                    }
                }
            } else {
                views.setViewVisibility(R.id.section_ready, View.GONE)
            }

            // ON COOLDOWN section
            if (cooldown.isNotEmpty()) {
                views.setViewVisibility(R.id.section_cooldown, View.VISIBLE)

                val cooldownCards = listOf(
                    Triple(R.id.cooldown_card_1, R.id.cooldown_name_1, R.id.cooldown_timer_1),
                    Triple(R.id.cooldown_card_2, R.id.cooldown_name_2, R.id.cooldown_timer_2),
                    Triple(R.id.cooldown_card_3, R.id.cooldown_name_3, R.id.cooldown_timer_3),
                    Triple(R.id.cooldown_card_4, R.id.cooldown_name_4, R.id.cooldown_timer_4),
                )

                cooldownCards.forEachIndexed { index, (cardId, nameId, timerId) ->
                    if (index < cooldown.size) {
                        val item = cooldown[index]
                        views.setViewVisibility(cardId, View.VISIBLE)
                        views.setTextViewText(nameId, item.name)
                        views.setTextViewText(timerId, formatCooldownTimer(item.availableInText))
                    } else {
                        views.setViewVisibility(cardId, View.GONE)
                    }
                }
            } else {
                views.setViewVisibility(R.id.section_cooldown, View.GONE)
            }

            // Tap whole widget to open app
            val clickIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val clickPending = PendingIntent.getActivity(
                context,
                201,
                clickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_as_needed, clickPending)

            manager.updateAppWidget(widgetId, views)
        }

        // Converts "Available in 1h 25m" → "READY IN\n1h 25m", or "Available in 55m" → "READY IN\n55m"
        private fun formatCooldownTimer(text: String): String {
            return text.replace("Available in ", "READY IN\n")
        }
    }
}
