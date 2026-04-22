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
import com.healthtrackerapp.widgets.AsNeededWidgetItem
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
            val ids = manager.getAppWidgetIds(ComponentName(context, AsNeededWidgetProvider::class.java))
            ids.forEach { updateWidget(context, manager, it) }
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_as_needed)
            val items = WidgetStorage.getAsNeededItems(context)

            val ready = items.filter { it.available }
            val cooldown = items.filter { !it.available && it.availableInText != "Daily limit reached" }

            // READY carousel
            if (ready.isNotEmpty()) {
                views.setViewVisibility(R.id.section_ready, View.VISIBLE)

                val readyPages = ready.chunked(2)
                val currentReadyPage = WidgetStorage.getReadyPage(context, widgetId)
                    .coerceIn(0, readyPages.lastIndex)

                val flipperViews = buildReadyFlipper(context, widgetId, readyPages, currentReadyPage)
                views.removeAllViews(R.id.ready_flipper)
                flipperViews.forEach { views.addView(R.id.ready_flipper, it) }
                views.setDisplayedChild(R.id.ready_flipper, currentReadyPage)

                if (readyPages.size > 1) {
                    views.setViewVisibility(R.id.ready_dots, View.VISIBLE)
                    views.setTextViewText(R.id.ready_dots, buildDots(readyPages.size, currentReadyPage))

                    val nextIntent = PendingIntent.getBroadcast(
                        context,
                        (300 + widgetId * 10),
                        Intent(context, WidgetActionReceiver::class.java).apply {
                            setPackage(context.packageName)
                            action = WidgetConstants.ACTION_NEXT_READY_PAGE
                            putExtra(WidgetConstants.EXTRA_WIDGET_ID, widgetId)
                        },
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.ready_flipper, nextIntent)
                } else {
                    views.setViewVisibility(R.id.ready_dots, View.GONE)
                }
            } else {
                views.setViewVisibility(R.id.section_ready, View.GONE)
            }

            // COOLDOWN carousel
            if (cooldown.isNotEmpty()) {
                views.setViewVisibility(R.id.section_cooldown, View.VISIBLE)

                val cooldownPages = cooldown.chunked(2)
                val currentCooldownPage = WidgetStorage.getCooldownPage(context, widgetId)
                    .coerceIn(0, cooldownPages.lastIndex)

                val flipperViews = buildCooldownFlipper(context, cooldownPages, currentCooldownPage)
                views.removeAllViews(R.id.cooldown_flipper)
                flipperViews.forEach { views.addView(R.id.cooldown_flipper, it) }
                views.setDisplayedChild(R.id.cooldown_flipper, currentCooldownPage)

                if (cooldownPages.size > 1) {
                    views.setViewVisibility(R.id.cooldown_dots, View.VISIBLE)
                    views.setTextViewText(R.id.cooldown_dots, buildDots(cooldownPages.size, currentCooldownPage))

                    val nextIntent = PendingIntent.getBroadcast(
                        context,
                        (300 + widgetId * 10 + 1),
                        Intent(context, WidgetActionReceiver::class.java).apply {
                            setPackage(context.packageName)
                            action = WidgetConstants.ACTION_NEXT_COOLDOWN_PAGE
                            putExtra(WidgetConstants.EXTRA_WIDGET_ID, widgetId)
                        },
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.cooldown_flipper, nextIntent)
                } else {
                    views.setViewVisibility(R.id.cooldown_dots, View.GONE)
                }
            } else {
                views.setViewVisibility(R.id.section_cooldown, View.GONE)
            }

            // Tap root to open app
            val clickPending = PendingIntent.getActivity(
                context, 201,
                context.packageManager.getLaunchIntentForPackage(context.packageName),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_as_needed, clickPending)

            manager.updateAppWidget(widgetId, views)
        }

        private fun buildReadyFlipper(
            context: Context,
            widgetId: Int,
            pages: List<List<AsNeededWidgetItem>>,
            currentPage: Int
        ): List<RemoteViews> {
            return pages.mapIndexed { pageIndex, pageItems ->
                RemoteViews(context.packageName, R.layout.widget_as_needed_page_ready).apply {
                    val cards = listOf(
                        Triple(R.id.ready_card_a, R.id.ready_name_a, R.id.ready_meta_a) to R.id.ready_btn_a,
                        Triple(R.id.ready_card_b, R.id.ready_name_b, R.id.ready_meta_b) to R.id.ready_btn_b,
                    )
                    cards.forEachIndexed { i, (ids, btnId) ->
                        val (cardId, nameId, metaId) = ids
                        if (i < pageItems.size) {
                            val item = pageItems[i]
                            setViewVisibility(cardId, View.VISIBLE)
                            setTextViewText(nameId, item.name)
                            setTextViewText(metaId, item.dosage)
                            val takePending = PendingIntent.getBroadcast(
                                context,
                                (202 + widgetId * 20 + pageIndex * 2 + i),
                                Intent(context, WidgetActionReceiver::class.java).apply {
                                    setPackage(context.packageName)
                                    action = WidgetConstants.ACTION_TAKE_AS_NEEDED
                                    putExtra(WidgetConstants.EXTRA_ITEM_ID, item.id)
                                },
                                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                            )
                            setOnClickPendingIntent(btnId, takePending)
                        } else {
                            setViewVisibility(cardId, View.INVISIBLE)
                        }
                    }
                }
            }
        }

        private fun buildCooldownFlipper(
            context: Context,
            pages: List<List<AsNeededWidgetItem>>,
            currentPage: Int
        ): List<RemoteViews> {
            return pages.map { pageItems ->
                RemoteViews(context.packageName, R.layout.widget_as_needed_page_cooldown).apply {
                    val cards = listOf(
                        Triple(R.id.cooldown_card_a, R.id.cooldown_name_a, R.id.cooldown_timer_a),
                        Triple(R.id.cooldown_card_b, R.id.cooldown_name_b, R.id.cooldown_timer_b),
                    )
                    cards.forEachIndexed { i, (cardId, nameId, timerId) ->
                        if (i < pageItems.size) {
                            val item = pageItems[i]
                            setViewVisibility(cardId, View.VISIBLE)
                            setTextViewText(nameId, item.name)
                            setTextViewText(timerId, formatCooldownTimer(item.availableInText))
                        } else {
                            setViewVisibility(cardId, View.INVISIBLE)
                        }
                    }
                }
            }
        }

        private fun buildDots(total: Int, current: Int): String =
            (0 until total).joinToString("  ") { if (it == current) "●" else "○" }

        private fun formatCooldownTimer(text: String): String =
            text.replace("Available in ", "READY IN\n")
    }
}
