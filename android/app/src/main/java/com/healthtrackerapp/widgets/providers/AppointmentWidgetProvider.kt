package com.healthtrackerapp.widgets.providers

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import com.healthtrackerapp.R
import com.healthtrackerapp.widgets.WidgetStorage

class AppointmentWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { updateWidget(context, appWidgetManager, it) }
    }

    companion object {
        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, AppointmentWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            ids.forEach { updateWidget(context, manager, it) }
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_appointment)
            val data = WidgetStorage.getAppointment(context)

            if (data == null) {
                views.setTextViewText(R.id.app_visit_type, "No upcoming appointment")
                views.setTextViewText(R.id.app_doctor, "")
                views.setTextViewText(R.id.app_datetime, "")
                views.setTextViewText(R.id.app_recommendations, "")
            } else {
                views.setTextViewText(R.id.app_visit_type, data.title)
                views.setTextViewText(R.id.app_doctor, "${data.doctor} • ${data.specialty}")
                views.setTextViewText(R.id.app_datetime, "${data.dayOfWeek} • ${data.dateTimeText}")
                views.setTextViewText(
                    R.id.app_recommendations,
                    data.recommendations.joinToString(separator = "\n• ", prefix = "• ")
                )
            }

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val pendingIntent = PendingIntent.getActivity(
                context,
                301,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_appointment, pendingIntent)

            manager.updateAppWidget(widgetId, views)
        }
    }
}
