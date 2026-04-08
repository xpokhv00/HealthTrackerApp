package com.healthtrackerapp.widgets

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

object WidgetActionQueue {

    fun enqueueRoutineTaken(context: Context, slotId: String) {
        enqueue(
            context,
            JSONObject().apply {
                put("type", "routine_slot_taken")
                put("slotId", slotId)
                put("createdAt", Instant.now().toString())
            }
        )
    }

    fun enqueueAsNeededTaken(context: Context, medicationId: String) {
        enqueue(
            context,
            JSONObject().apply {
                put("type", "as_needed_taken")
                put("medicationId", medicationId)
                put("createdAt", Instant.now().toString())
            }
        )
    }

    private fun enqueue(context: Context, action: JSONObject) {
        val prefs = context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(WidgetConstants.KEY_ACTION_QUEUE_JSON, "[]") ?: "[]"
        val arr = JSONArray(raw)
        arr.put(action)

        prefs.edit()
            .putString(WidgetConstants.KEY_ACTION_QUEUE_JSON, arr.toString())
            .apply()
    }

    fun getQueue(context: Context): JSONArray {
        val prefs = context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(WidgetConstants.KEY_ACTION_QUEUE_JSON, "[]") ?: "[]"
        return JSONArray(raw)
    }

    fun clearQueue(context: Context) {
        context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(WidgetConstants.KEY_ACTION_QUEUE_JSON, "[]")
            .apply()
    }
}
