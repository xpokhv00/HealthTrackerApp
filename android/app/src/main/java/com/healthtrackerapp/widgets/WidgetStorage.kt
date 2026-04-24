package com.healthtrackerapp.widgets

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object WidgetStorage {
    fun getRoutineItems(context: Context): List<RoutineWidgetItem> {
        val prefs = context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(WidgetConstants.KEY_ROUTINE_JSON, "[]") ?: "[]"
        val arr = JSONArray(raw)
        val result = mutableListOf<RoutineWidgetItem>()

        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            result.add(
                RoutineWidgetItem(
                    id = obj.optString("id"),
                    name = obj.optString("name"),
                    dosage = obj.optString("dosage"),
                    time = obj.optString("time"),
                    status = obj.optString("status"),
                    scheduleProgress = obj.optInt("scheduleProgress", 0)
                )
            )
        }

        return result
    }

    fun saveRoutineItems(context: Context, rawJson: String) {
        context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(WidgetConstants.KEY_ROUTINE_JSON, rawJson)
            .apply()
    }

    fun getAsNeededItems(context: Context): List<AsNeededWidgetItem> {
        val prefs = context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(WidgetConstants.KEY_AS_NEEDED_JSON, "[]") ?: "[]"
        val arr = JSONArray(raw)
        val result = mutableListOf<AsNeededWidgetItem>()

        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            result.add(
                AsNeededWidgetItem(
                    id = obj.optString("id"),
                    name = obj.optString("name"),
                    dosage = obj.optString("dosage"),
                    available = obj.optBoolean("available"),
                    availableInText = obj.optString("availableInText"),
                    cooldownProgress = obj.optInt("cooldownProgress", 0)
                )
            )
        }

        return result
    }

    fun saveAsNeededItems(context: Context, rawJson: String) {
        context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(WidgetConstants.KEY_AS_NEEDED_JSON, rawJson)
            .apply()
    }

    fun getAppointment(context: Context): AppointmentWidgetData? {
        val prefs = context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
        val raw = prefs.getString(WidgetConstants.KEY_APPOINTMENT_JSON, null) ?: return null
        val obj = JSONObject(raw)

        return AppointmentWidgetData(
            title = obj.optString("title"),
            doctor = obj.optString("doctor"),
            specialty = obj.optString("specialty"),
            location = obj.optString("location"),
            dayOfWeek = obj.optString("dayOfWeek"),
            dateTimeText = obj.optString("dateTimeText"),
            recommendations = buildList {
                val arr = obj.optJSONArray("recommendations") ?: JSONArray()
                for (i in 0 until arr.length()) {
                    add(arr.optString(i))
                }
            },
            hoursUntil = obj.optInt("hoursUntil", 999),
            appointmentId = obj.optString("appointmentId")
        )
    }

    fun getChipState(context: Context, appointmentId: String, chipKey: String): Boolean {
        return context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .getBoolean("appt_chip_${appointmentId}_$chipKey", false)
    }

    fun toggleChipState(context: Context, appointmentId: String, chipKey: String) {
        val prefs = context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
        val current = prefs.getBoolean("appt_chip_${appointmentId}_$chipKey", false)
        prefs.edit().putBoolean("appt_chip_${appointmentId}_$chipKey", !current).apply()
    }

    fun getReadyPage(context: Context, widgetId: Int): Int {
        return context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .getInt("ready_page_$widgetId", 0)
    }

    fun setReadyPage(context: Context, widgetId: Int, page: Int) {
        context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .edit().putInt("ready_page_$widgetId", page).apply()
    }

    fun getCooldownPage(context: Context, widgetId: Int): Int {
        return context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .getInt("cooldown_page_$widgetId", 0)
    }

    fun setCooldownPage(context: Context, widgetId: Int, page: Int) {
        context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .edit().putInt("cooldown_page_$widgetId", page).apply()
    }

    fun saveAppointment(context: Context, rawJson: String?) {
        context.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(WidgetConstants.KEY_APPOINTMENT_JSON, rawJson)
            .apply()
    }
}
