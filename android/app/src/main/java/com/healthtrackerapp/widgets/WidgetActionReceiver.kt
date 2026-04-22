package com.healthtrackerapp.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.healthtrackerapp.widgets.providers.AsNeededWidgetProvider
import com.healthtrackerapp.widgets.providers.RoutineWidgetProvider
import org.json.JSONArray
import org.json.JSONObject

class WidgetActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            WidgetConstants.ACTION_TAKE_ROUTINE -> {
                val itemId = intent.getStringExtra(WidgetConstants.EXTRA_ITEM_ID) ?: return
                val items = WidgetStorage.getRoutineItems(context).map {
                    if (it.id == itemId) it.copy(status = "taken") else it
                }.sortedWith(compareBy(
                    { statusOrder(it.status) },
                    { it.time }
                ))

                val arr = JSONArray()
                items.forEach {
                    arr.put(
                        JSONObject().apply {
                            put("id", it.id)
                            put("name", it.name)
                            put("dosage", it.dosage)
                            put("time", it.time)
                            put("status", it.status)
                        }
                    )
                }

                WidgetStorage.saveRoutineItems(context, arr.toString())
                WidgetActionQueue.enqueueRoutineTaken(context, itemId)
                RoutineWidgetProvider.updateAll(context)
            }

            WidgetConstants.ACTION_TAKE_AS_NEEDED -> {
                val itemId = intent.getStringExtra(WidgetConstants.EXTRA_ITEM_ID) ?: return
                val items = WidgetStorage.getAsNeededItems(context).map {
                    if (it.id == itemId) it.copy(available = false, availableInText = "Updating…") else it
                }

                val arr = JSONArray()
                items.forEach {
                    arr.put(
                        JSONObject().apply {
                            put("id", it.id)
                            put("name", it.name)
                            put("dosage", it.dosage)
                            put("available", it.available)
                            put("availableInText", it.availableInText)
                        }
                    )
                }

                WidgetStorage.saveAsNeededItems(context, arr.toString())
                WidgetActionQueue.enqueueAsNeededTaken(context, itemId)
                AsNeededWidgetProvider.updateAll(context)
            }

            WidgetConstants.ACTION_NEXT_READY_PAGE -> {
                val widgetId = intent.getIntExtra(WidgetConstants.EXTRA_WIDGET_ID, -1)
                if (widgetId == -1) return
                val ready = WidgetStorage.getAsNeededItems(context).filter { it.available }
                val pageCount = (ready.size + 1) / 2
                if (pageCount > 1) {
                    val current = WidgetStorage.getReadyPage(context, widgetId)
                    WidgetStorage.setReadyPage(context, widgetId, (current + 1) % pageCount)
                }
                AsNeededWidgetProvider.updateAll(context)
            }

            WidgetConstants.ACTION_NEXT_COOLDOWN_PAGE -> {
                val widgetId = intent.getIntExtra(WidgetConstants.EXTRA_WIDGET_ID, -1)
                if (widgetId == -1) return
                val cooldown = WidgetStorage.getAsNeededItems(context)
                    .filter { !it.available && it.availableInText != "Daily limit reached" }
                val pageCount = (cooldown.size + 1) / 2
                if (pageCount > 1) {
                    val current = WidgetStorage.getCooldownPage(context, widgetId)
                    WidgetStorage.setCooldownPage(context, widgetId, (current + 1) % pageCount)
                }
                AsNeededWidgetProvider.updateAll(context)
            }
        }
    }

    private fun statusOrder(status: String): Int {
        return when (status) {
            "missed" -> 0
            "pending" -> 1
            "taken" -> 2
            else -> 3
        }
    }
}
