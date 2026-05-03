package com.healthtrackerapp.widgets.providers

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import com.healthtrackerapp.R
import com.healthtrackerapp.widgets.WidgetActionReceiver
import com.healthtrackerapp.widgets.WidgetConstants
import com.healthtrackerapp.widgets.WidgetStorage

class AppointmentWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { updateWidget(context, appWidgetManager, it) }
    }

    companion object {
        private val CHIP_KEYS = listOf("symptoms", "meds", "report")
        private val CHIP_IDS = listOf(R.id.chip_symptoms, R.id.chip_meds, R.id.chip_report)
        private val CHIP_LABELS = listOf("SYMPTOMS", "MEDS LIST", "BLOOD REP.")

        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, AppointmentWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            ids.forEach { updateWidget(context, manager, it) }
        }

        private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.widget_appointment)
            val data = WidgetStorage.getAppointment(context)

            // Full-widget tap → open app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val launchPending = PendingIntent.getActivity(
                context, 301, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root_appointment, launchPending)

            if (data == null) {
                views.setTextViewText(R.id.appt_urgency_pill, "NO UPCOMING APPOINTMENT")
                views.setTextViewText(R.id.appt_cta_zone, "OPEN APP")
                views.setOnClickPendingIntent(R.id.appt_cta_zone, launchPending)
                applyPillDistant(views)
                views.setViewVisibility(R.id.appt_hero_block, View.GONE)
                views.setViewVisibility(R.id.appt_divider, View.GONE)
                views.setViewVisibility(R.id.appt_checklist_label, View.GONE)
                views.setViewVisibility(R.id.appt_checklist_block, View.GONE)
                manager.updateAppWidget(widgetId, views)
                return
            }

            val overdue = data.hoursUntil < 0
            val urgent = data.hoursUntil in 0..48

            // Row 1: Urgency pill
            views.setTextViewText(R.id.appt_urgency_pill, buildPillText(data.hoursUntil, data.dateTimeText))
            when {
                overdue -> applyPillOverdue(views)
                urgent  -> applyPillUrgent(views)
                else    -> applyPillDistant(views)
            }

            // Row 1: CTA
            if (urgent || overdue) {
                views.setTextViewText(R.id.appt_cta_zone, "📍 MAP")
                val geoQuery = if (data.location.isNotEmpty()) data.location else data.specialty
                val geoIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=${Uri.encode(geoQuery)}"))
                geoIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                val geoPending = PendingIntent.getActivity(
                    context, 302, geoIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.appt_cta_zone, geoPending)
            } else {
                views.setTextViewText(R.id.appt_cta_zone, "PREPARE LIST")
                views.setOnClickPendingIntent(R.id.appt_cta_zone, launchPending)
            }

            // Row 2: Hero
            views.setTextViewText(R.id.appt_hero_title, data.doctor)
            views.setTextViewText(R.id.appt_hero_time, "${data.dayOfWeek} · ${data.timeText}")
            val subLine = buildString {
                append(data.specialty)
                if (data.location.isNotEmpty()) append(" · ${data.location}")
            }
            views.setTextViewText(R.id.appt_hero_sub, subLine)

            // Row 3: Prep chips
            CHIP_KEYS.forEachIndexed { i, key ->
                val ready = WidgetStorage.getChipState(context, data.appointmentId, key)
                val chipId = CHIP_IDS[i]

                if (ready) {
                    views.setTextViewText(chipId, "●  ${CHIP_LABELS[i]}")
                    views.setInt(chipId, "setBackgroundResource", R.drawable.widget_appt_chip_ready)
                    views.setTextColor(chipId, 0xFF166534.toInt())
                } else {
                    views.setTextViewText(chipId, "○  ${CHIP_LABELS[i]}")
                    views.setInt(chipId, "setBackgroundResource", R.drawable.widget_appt_chip_pending)
                    views.setTextColor(chipId, 0xFF374151.toInt())
                }

                val toggleIntent = Intent(context, WidgetActionReceiver::class.java).apply {
                    setPackage(context.packageName)
                    action = WidgetConstants.ACTION_TOGGLE_APPT_CHIP
                    putExtra(WidgetConstants.EXTRA_APPT_ID, data.appointmentId)
                    putExtra(WidgetConstants.EXTRA_CHIP_KEY, key)
                }
                val togglePending = PendingIntent.getBroadcast(
                    context, 400 + i, toggleIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(chipId, togglePending)
            }

            manager.updateAppWidget(widgetId, views)
        }

        private fun buildPillText(hoursUntil: Int, dateTimeText: String): String = when {
            hoursUntil < 0  -> "OVERDUE · $dateTimeText"
            hoursUntil == 0 -> "TODAY · $dateTimeText"
            hoursUntil <= 24 -> "TOMORROW · $dateTimeText"
            else -> "IN ${hoursUntil / 24} DAYS · $dateTimeText"
        }

        private fun applyPillOverdue(views: RemoteViews) {
            views.setInt(R.id.appt_urgency_pill, "setBackgroundResource", R.drawable.widget_appt_pill_overdue)
            views.setTextColor(R.id.appt_urgency_pill, 0xFFFFFFFF.toInt())
        }

        private fun applyPillUrgent(views: RemoteViews) {
            views.setInt(R.id.appt_urgency_pill, "setBackgroundResource", R.drawable.widget_appt_pill_urgent)
            views.setTextColor(R.id.appt_urgency_pill, 0xFFFFFFFF.toInt())
        }

        private fun applyPillDistant(views: RemoteViews) {
            views.setInt(R.id.appt_urgency_pill, "setBackgroundResource", R.drawable.widget_appt_pill_distant)
            views.setTextColor(R.id.appt_urgency_pill, 0xFF6B7280.toInt())
        }

        private fun applyChipsPending(views: RemoteViews) {
            CHIP_IDS.forEachIndexed { i, chipId ->
                views.setTextViewText(chipId, "○  ${CHIP_LABELS[i]}")
                views.setInt(chipId, "setBackgroundResource", R.drawable.widget_appt_chip_pending)
                views.setTextColor(chipId, 0xFF374151.toInt())
            }
        }
    }
}
