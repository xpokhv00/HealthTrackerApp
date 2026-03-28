package com.healthtrackerapp

import android.content.Context
import com.facebook.react.bridge.*

class HealthWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "HealthWidgetModule"

    @ReactMethod
    fun updateMedicationWidget(data: ReadableMap, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("health_widget_prefs", Context.MODE_PRIVATE)

            val name = if (data.hasKey("name")) data.getString("name") else "No medication"
            val dosage = if (data.hasKey("dosage")) data.getString("dosage") else "Add a routine medication"
            val nextTime = if (data.hasKey("nextTime")) data.getString("nextTime") else "No next time"

            prefs.edit()
                .putString("medication_name", name)
                .putString("medication_dosage", dosage)
                .putString("medication_next_time", nextTime)
                .apply()

            MedicationWidgetProvider.updateAllWidgets(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", e)
        }
    }

    @ReactMethod
    fun clearMedicationWidget(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("health_widget_prefs", Context.MODE_PRIVATE)

            prefs.edit()
                .putString("medication_name", "No medication")
                .putString("medication_dosage", "Add a routine medication")
                .putString("medication_next_time", "No next time")
                .apply()

            MedicationWidgetProvider.updateAllWidgets(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_CLEAR_ERROR", e)
        }
    }
}
