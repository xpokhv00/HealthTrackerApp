package com.healthtrackerapp

import android.content.Context
import com.facebook.react.bridge.*
import com.healthtrackerapp.widgets.WidgetActionQueue
import com.healthtrackerapp.widgets.WidgetConstants
import com.healthtrackerapp.widgets.WidgetStorage
import com.healthtrackerapp.widgets.providers.AppointmentWidgetProvider
import com.healthtrackerapp.widgets.providers.AsNeededWidgetProvider
import com.healthtrackerapp.widgets.providers.RoutineWidgetProvider
import org.json.JSONArray
import org.json.JSONObject

class HealthWidgetsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "HealthWidgetsModule"

    @ReactMethod
    fun updateRoutineWidget(items: ReadableArray, promise: Promise) {
        try {
            val arr = JSONArray()
            for (i in 0 until items.size()) {
                val map = items.getMap(i) ?: continue
                arr.put(
                    JSONObject().apply {
                        put("id", map.getString("id"))
                        put("name", map.getString("name"))
                        put("dosage", map.getString("dosage"))
                        put("time", map.getString("time"))
                        put("status", map.getString("status"))
                        put("scheduleProgress", map.getInt("scheduleProgress"))
                    }
                )
            }

            WidgetStorage.saveRoutineItems(reactContext, arr.toString())
            RoutineWidgetProvider.updateAll(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ROUTINE_WIDGET_ERROR", e)
        }
    }

    @ReactMethod
    fun updateAsNeededWidget(items: ReadableArray, promise: Promise) {
        try {
            val arr = JSONArray()
            for (i in 0 until items.size()) {
                val map = items.getMap(i) ?: continue
                arr.put(
                    JSONObject().apply {
                        put("id", map.getString("id"))
                        put("name", map.getString("name"))
                        put("dosage", map.getString("dosage"))
                        put("available", map.getBoolean("available"))
                        put("availableInText", map.getString("availableInText"))
                        put("cooldownProgress", map.getInt("cooldownProgress"))
                    }
                )
            }

            WidgetStorage.saveAsNeededItems(reactContext, arr.toString())
            AsNeededWidgetProvider.updateAll(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("AS_NEEDED_WIDGET_ERROR", e)
        }
    }

    @ReactMethod
    fun updateAppointmentWidget(data: ReadableMap?, promise: Promise) {
        try {
            if (data == null) {
                WidgetStorage.saveAppointment(reactContext, null)
            } else {
                val recommendations = JSONArray()
                val arr = data.getArray("recommendations")
                if (arr != null) {
                    for (i in 0 until arr.size()) {
                        recommendations.put(arr.getString(i))
                    }
                }

                val obj = JSONObject().apply {
                    put("title", data.getString("title"))
                    put("doctor", data.getString("doctor"))
                    put("specialty", data.getString("specialty"))
                    put("dayOfWeek", data.getString("dayOfWeek"))
                    put("dateTimeText", data.getString("dateTimeText"))
                    put("recommendations", recommendations)
                }

                WidgetStorage.saveAppointment(reactContext, obj.toString())
            }

            AppointmentWidgetProvider.updateAll(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("APPOINTMENT_WIDGET_ERROR", e)
        }
    }

    @ReactMethod
    fun getPendingWidgetActions(promise: Promise) {
        try {
            val arr = WidgetActionQueue.getQueue(reactContext)
            val result = Arguments.createArray()

            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val map = Arguments.createMap()
                val type = obj.optString("type")

                map.putString("type", type)
                map.putString("createdAt", obj.optString("createdAt"))

                if (type == "routine_slot_taken") {
                    map.putString("slotId", obj.optString("slotId"))
                }

                if (type == "as_needed_taken") {
                    map.putString("medicationId", obj.optString("medicationId"))
                }

                result.pushMap(map)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("GET_WIDGET_ACTIONS_ERROR", e)
        }
    }

    @ReactMethod
    fun clearPendingWidgetActions(promise: Promise) {
        try {
            WidgetActionQueue.clearQueue(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_WIDGET_ACTIONS_ERROR", e)
        }
    }

    @ReactMethod
    fun clearAllWidgets(promise: Promise) {
        try {
            reactContext.getSharedPreferences(WidgetConstants.PREFS, Context.MODE_PRIVATE)
                .edit()
                .clear()
                .apply()

            RoutineWidgetProvider.updateAll(reactContext)
            AsNeededWidgetProvider.updateAll(reactContext)
            AppointmentWidgetProvider.updateAll(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_WIDGETS_ERROR", e)
        }
    }
}
