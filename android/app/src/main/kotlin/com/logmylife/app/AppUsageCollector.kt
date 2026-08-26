package com.logmylife.app

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Process
import java.security.MessageDigest

/**
 * LogMyLife Native App Usage & Raw Activity Event Collector
 * Queries Android UsageStatsManager and yields normalized raw event records.
 */
object AppUsageCollector {

    fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun getInstalledApps(context: Context): List<Map<String, Any>> {
        val pm = context.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        val result = mutableListOf<Map<String, Any>>()

        for (app in packages) {
            // Ignore low-level system background processes without launch intent if desired, or include user apps
            val appName = pm.getApplicationLabel(app).toString()
            val packageName = app.packageName
            val isSystem = (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0

            result.add(
                mapOf(
                    "appName" to appName,
                    "packageName" to packageName,
                    "isSystem" to isSystem
                )
            )
        }
        return result
    }

    fun queryRawEvents(context: Context, startTime: Long, endTime: Long): List<Map<String, Any>> {
        if (!hasUsageStatsPermission(context)) {
            return emptyList()
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return emptyList()

        val events = usageStatsManager.queryEvents(startTime, endTime)
        val rawList = mutableListOf<Map<String, Any>>()
        val event = UsageEvents.Event()
        val now = System.currentTimeMillis()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)

            val eventTypeStr = when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED,
                UsageEvents.Event.MOVE_TO_FOREGROUND -> "MOVE_TO_FOREGROUND"
                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED,
                UsageEvents.Event.MOVE_TO_BACKGROUND -> "MOVE_TO_BACKGROUND"
                UsageEvents.Event.SCREEN_INTERACTIVE -> "SCREEN_ON"
                UsageEvents.Event.SCREEN_NON_INTERACTIVE -> "SCREEN_OFF"
                UsageEvents.Event.KEYGUARD_HIDDEN -> "DEVICE_UNLOCKED"
                UsageEvents.Event.KEYGUARD_SHOWN -> "SCREEN_OFF"
                else -> null
            }

            if (eventTypeStr != null) {
                val pkg = event.packageName ?: "android.system"
                val ts = event.timeStamp
                val eventId = generateEventId(pkg, ts, eventTypeStr)

                val deviceState = when (eventTypeStr) {
                    "SCREEN_OFF" -> "locked"
                    "DEVICE_UNLOCKED" -> "active"
                    else -> "active"
                }

                rawList.add(
                    mapOf(
                        "eventId" to eventId,
                        "packageName" to pkg,
                        "eventType" to eventTypeStr,
                        "timestamp" to ts,
                        "source" to "usage_stats",
                        "deviceState" to deviceState,
                        "receivedAt" to now
                    )
                )
            }
        }

        return rawList
    }

    private fun generateEventId(packageName: String, timestamp: Long, eventType: String): String {
        val raw = "$packageName-$timestamp-$eventType"
        return try {
            val md = MessageDigest.getInstance("MD5")
            val bytes = md.digest(raw.toByteArray())
            bytes.joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            "ev_${timestamp}_${packageName.hashCode()}"
        }
    }
}
