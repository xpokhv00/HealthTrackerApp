package com.healthtrackerapp.widgets.services

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.healthtrackerapp.R
import com.healthtrackerapp.widgets.WidgetActionReceiver
import com.healthtrackerapp.widgets.WidgetConstants
import com.healthtrackerapp.widgets.WidgetStorage

class RoutineWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return Factory(applicationContext)
    }

    class Factory(private val context: Context) : RemoteViewsFactory {
        private var items = emptyList<com.healthtrackerapp.widgets.RoutineWidgetItem>()

        override fun onCreate() {}

        override fun onDataSetChanged() {
            items = WidgetStorage.getRoutineItems(context)
        }

        override fun onDestroy() {}

        override fun getCount(): Int = items.size

        override fun getViewAt(position: Int): RemoteViews {
            val item = items[position]
            val views = RemoteViews(context.packageName, R.layout.widget_routine_item)

            views.setTextViewText(R.id.item_name, item.name)
            views.setTextViewText(R.id.item_meta, "${item.dosage} • ${item.time}")

            val statusText = when (item.status) {
                "taken" -> "Taken on time"
                "missed" -> "Missed"
                else -> "Pending"
            }

            views.setTextViewText(R.id.item_status, statusText)

            when (item.status) {
                "taken" -> {
                    views.setTextViewText(R.id.item_action, "TAKEN")
                    views.setInt(R.id.item_action, "setBackgroundResource", R.drawable.widget_action_passive_bg)
                    views.setTextColor(R.id.item_action, 0xFF667085.toInt())
                    views.setOnClickFillInIntent(R.id.item_action, Intent())
                }

                "missed" -> {
                    views.setTextViewText(R.id.item_action, "TAKE")
                    views.setInt(R.id.item_action, "setBackgroundResource", R.drawable.widget_action_primary_bg)
                    views.setTextColor(R.id.item_action, 0xFFFFFFFF.toInt())

                    val fillInIntent = Intent().apply {
                        action = WidgetConstants.ACTION_TAKE_ROUTINE
                        putExtra(WidgetConstants.EXTRA_ITEM_ID, item.id)
                    }

                    views.setOnClickFillInIntent(R.id.item_action, fillInIntent)
                }

                else -> {
                    views.setTextViewText(R.id.item_action, "TAKE")
                    views.setInt(R.id.item_action, "setBackgroundResource", R.drawable.widget_action_primary_bg)
                    views.setTextColor(R.id.item_action, 0xFFFFFFFF.toInt())

                    val fillInIntent = Intent().apply {
                        action = WidgetConstants.ACTION_TAKE_ROUTINE
                        putExtra(WidgetConstants.EXTRA_ITEM_ID, item.id)
                    }

                    views.setOnClickFillInIntent(R.id.item_action, fillInIntent)
                }
            }

            val statusColor = when (item.status) {
                "taken" -> 0xFF2563EB.toInt()
                "missed" -> 0xFFDC2626.toInt()
                else -> 0xFF4C7EFF.toInt()
            }

            views.setTextColor(R.id.item_status, statusColor)

            return views
        }

        override fun getLoadingView(): RemoteViews? = null
        override fun getViewTypeCount(): Int = 1
        override fun getItemId(position: Int): Long = position.toLong()
        override fun hasStableIds(): Boolean = true
    }
}
