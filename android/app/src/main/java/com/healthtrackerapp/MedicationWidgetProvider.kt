package com.healthtrackerapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class MedicationWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { appWidgetId ->
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, MedicationWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)

            appWidgetIds.forEach { appWidgetId ->
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }

        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences("health_widget_prefs", Context.MODE_PRIVATE)

            val name = prefs.getString("medication_name", "No medication") ?: "No medication"
            val dosage = prefs.getString("medication_dosage", "Add a routine medication")
                ?: "Add a routine medication"
            val nextTime = prefs.getString("medication_next_time", "No next time")
                ?: "No next time"

            val views = RemoteViews(context.packageName, R.layout.medication_widget)

            views.setTextViewText(R.id.widget_medication_name, name)
            views.setTextViewText(R.id.widget_medication_dosage, dosage)
            views.setTextViewText(R.id.widget_medication_time, nextTime)

            val launchIntent =
                context.packageManager.getLaunchIntentForPackage(context.packageName)

            val pendingIntent = PendingIntent.getActivity(
                context,
                1001,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
