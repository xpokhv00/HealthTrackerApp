package com.healthtrackerapp.widgets.services

import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.healthtrackerapp.R
import com.healthtrackerapp.widgets.RoutineWidgetItem
import com.healthtrackerapp.widgets.WidgetConstants
import com.healthtrackerapp.widgets.WidgetStorage

class RoutineWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory =
        DoneTodayFactory(applicationContext)

    class DoneTodayFactory(private val context: Context) : RemoteViewsFactory {
        private var items: List<RoutineWidgetItem> = emptyList()

        override fun onCreate() {}

        override fun onDataSetChanged() {
            items = WidgetStorage.getRoutineItems(context).filter { it.status == "taken" }
        }

        override fun onDestroy() {}

        override fun getCount(): Int = items.size

        override fun getViewAt(position: Int): RemoteViews {
            val item = items[position]
            return RemoteViews(context.packageName, R.layout.widget_routine_item).apply {
                setTextViewText(R.id.done_item_name, item.name)
                setTextViewText(R.id.done_item_meta, "${item.dosage} · ${item.time}")
            }
        }

        override fun getLoadingView(): RemoteViews? = null
        override fun getViewTypeCount(): Int = 1
        override fun getItemId(position: Int): Long = position.toLong()
        override fun hasStableIds(): Boolean = true
    }
}
