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

                views.removeAllViews(R.id.ready_flipper)
                for (page in buildReadyPages(context, widgetId, readyPages)) {
                    views.addView(R.id.ready_flipper, page)
                }
                views.setDisplayedChild(R.id.ready_flipper, currentReadyPage)

                if (readyPages.size > 1) {
                    views.setViewVisibility(R.id.ready_dots, View.VISIBLE)
                    views.setTextViewText(R.id.ready_dots, buildDots(readyPages.size, currentReadyPage))
                    views.setOnClickPendingIntent(
                        R.id.ready_flipper,
                        makeBroadcast(context, 300 + widgetId * 10, WidgetConstants.ACTION_NEXT_READY_PAGE, widgetId)
                    )
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

                views.removeAllViews(R.id.cooldown_flipper)
                for (page in buildCooldownPages(context, cooldownPages)) {
                    views.addView(R.id.cooldown_flipper, page)
                }
                views.setDisplayedChild(R.id.cooldown_flipper, currentCooldownPage)

                if (cooldownPages.size > 1) {
                    views.setViewVisibility(R.id.cooldown_dots, View.VISIBLE)
                    views.setTextViewText(R.id.cooldown_dots, buildDots(cooldownPages.size, currentCooldownPage))
                    views.setOnClickPendingIntent(
                        R.id.cooldown_flipper,
                        makeBroadcast(context, 301 + widgetId * 10, WidgetConstants.ACTION_NEXT_COOLDOWN_PAGE, widgetId)
                    )
                } else {
                    views.setViewVisibility(R.id.cooldown_dots, View.GONE)
                }
            } else {
                views.setViewVisibility(R.id.section_cooldown, View.GONE)
            }

            val clickPending = PendingIntent.getActivity(
                context, 201,
                context.packageManager.getLaunchIntentForPackage(context.packageName),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_as_needed, clickPending)

            manager.updateAppWidget(widgetId, views)
        }

        private fun buildReadyPages(
            context: Context,
            widgetId: Int,
            pages: List<List<AsNeededWidgetItem>>
        ): List<RemoteViews> {
            val cardIds = intArrayOf(R.id.ready_card_a, R.id.ready_card_b)
            val nameIds = intArrayOf(R.id.ready_name_a, R.id.ready_name_b)
            val metaIds = intArrayOf(R.id.ready_meta_a, R.id.ready_meta_b)
            val btnIds = intArrayOf(R.id.ready_btn_a, R.id.ready_btn_b)

            return pages.mapIndexed { pageIndex, pageItems ->
                RemoteViews(context.packageName, R.layout.widget_as_needed_page_ready).apply {
                    for (i in 0..1) {
                        if (i < pageItems.size) {
                            val item = pageItems[i]
                            setViewVisibility(cardIds[i], View.VISIBLE)
                            setTextViewText(nameIds[i], item.name)
                            setTextViewText(metaIds[i], item.dosage)
                            setOnClickPendingIntent(
                                btnIds[i],
                                makeTakeAsNeededIntent(context, 202 + widgetId * 20 + pageIndex * 2 + i, item.id)
                            )
                        } else {
                            setViewVisibility(cardIds[i], View.INVISIBLE)
                        }
                    }
                }
            }
        }

        private fun buildCooldownPages(
            context: Context,
            pages: List<List<AsNeededWidgetItem>>
        ): List<RemoteViews> {
            val cardIds = intArrayOf(R.id.cooldown_card_a, R.id.cooldown_card_b)
            val nameIds = intArrayOf(R.id.cooldown_name_a, R.id.cooldown_name_b)
            val timerIds = intArrayOf(R.id.cooldown_timer_a, R.id.cooldown_timer_b)

            return pages.map { pageItems ->
                RemoteViews(context.packageName, R.layout.widget_as_needed_page_cooldown).apply {
                    for (i in 0..1) {
                        if (i < pageItems.size) {
                            val item = pageItems[i]
                            setViewVisibility(cardIds[i], View.VISIBLE)
                            setTextViewText(nameIds[i], item.name)
                            setTextViewText(timerIds[i], item.availableInText.replace("Available in ", "READY IN\n"))
                        } else {
                            setViewVisibility(cardIds[i], View.INVISIBLE)
                        }
                    }
                }
            }
        }

        private fun makeTakeAsNeededIntent(context: Context, requestCode: Int, itemId: String): PendingIntent =
            PendingIntent.getBroadcast(
                context, requestCode,
                Intent(context, WidgetActionReceiver::class.java).apply {
                    setPackage(context.packageName)
                    action = WidgetConstants.ACTION_TAKE_AS_NEEDED
                    putExtra(WidgetConstants.EXTRA_ITEM_ID, itemId)
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

        private fun makeBroadcast(context: Context, requestCode: Int, action: String, widgetId: Int): PendingIntent =
            PendingIntent.getBroadcast(
                context, requestCode,
                Intent(context, WidgetActionReceiver::class.java).apply {
                    setPackage(context.packageName)
                    this.action = action
                    putExtra(WidgetConstants.EXTRA_WIDGET_ID, widgetId)
                },
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

        private fun buildDots(total: Int, current: Int): String =
            (0 until total).joinToString("  ") { if (it == current) "●" else "○" }
    }
}
