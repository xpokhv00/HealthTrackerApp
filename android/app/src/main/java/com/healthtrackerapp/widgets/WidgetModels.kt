package com.healthtrackerapp.widgets

data class RoutineWidgetItem(
    val id: String,
    val name: String,
    val dosage: String,
    val time: String,
    val status: String
)

data class AsNeededWidgetItem(
    val id: String,
    val name: String,
    val dosage: String,
    val available: Boolean,
    val availableInText: String
)

data class AppointmentWidgetData(
    val title: String,
    val doctor: String,
    val specialty: String,
    val dayOfWeek: String,
    val dateTimeText: String,
    val recommendations: List<String>
)
