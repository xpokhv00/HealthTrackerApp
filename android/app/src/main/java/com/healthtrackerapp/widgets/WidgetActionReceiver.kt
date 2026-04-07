package com.healthtrackerapp.widgets

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.healthtrackerapp.widgets.providers.AppointmentWidgetProvider
import com.healthtrackerapp.widgets.providers.AsNeededWidgetProvider
import com.healthtrackerapp.widgets.providers.RoutineWidgetProvider
import org.json.JSONArray
import org.json.JSONObject

class WidgetActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val itemId = intent.getStringExtra(WidgetConstants.EXTRA_ITEM_ID) ?: return

        when (intent.action) {
            WidgetConstants.ACTION_TAKE_ROUTINE -> {
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
                val items = WidgetStorage.getAsNeededItems(context).map {
                    if (it.id == itemId) {
                        it.copy(
                            available = false,
                            availableInText = "Available in 4h"
                        )
                    } else {
                        it
                    }
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
        }
    }

    private fun statusOrder(status: String): Int {
        return when (status) {
            "pending" -> 0
            "missed" -> 1
            "taken" -> 2
            else -> 3
        }
    }
}
