package com.logmylife.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

/**
 * LogMyLife Native Plugin Bridge
 * Exposes MethodChannel and EventChannel for seamless Flutter <-> Android integration.
 */
class LogMyLifeNativePlugin : FlutterPlugin, MethodChannel.MethodCallHandler {

    private lateinit var channel: MethodChannel
    private lateinit var eventChannel: EventChannel
    private var context: Context? = null

    override fun onAttachedToEngine(flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        context = flutterPluginBinding.applicationContext

        channel = MethodChannel(flutterPluginBinding.binaryMessenger, METHOD_CHANNEL_NAME)
        channel.setMethodCallHandler(this)

        eventChannel = EventChannel(flutterPluginBinding.binaryMessenger, EVENT_CHANNEL_NAME)
        eventChannel.setStreamHandler(object : EventChannel.StreamHandler {
            override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                // Future live streaming hook if needed
            }

            override fun onCancel(arguments: Any?) {
                // Cancel stream
            }
        })
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        val ctx = context ?: run {
            result.error("NO_CONTEXT", "Application context is null", null)
            return
        }

        when (call.method) {
            "hasUsageStatsPermission" -> {
                val hasPerm = AppUsageCollector.hasUsageStatsPermission(ctx)
                result.success(hasPerm)
            }

            "requestUsageStatsPermission" -> {
                try {
                    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    ctx.startActivity(intent)
                    result.success(true)
                } catch (e: Exception) {
                    result.error("PERMISSION_ERROR", e.localizedMessage, null)
                }
            }

            "isBatteryOptimizationIgnored" -> {
                val pm = ctx.getSystemService(Context.POWER_SERVICE) as? PowerManager
                val isIgnoring = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    pm?.isIgnoringBatteryOptimizations(ctx.packageName) ?: false
                } else {
                    true
                }
                result.success(isIgnoring)
            }

            "requestIgnoreBatteryOptimization" -> {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                            data = Uri.parse("package:${ctx.packageName}")
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        ctx.startActivity(intent)
                    }
                    result.success(true)
                } catch (e: Exception) {
                    // Fallback to battery optimization settings
                    try {
                        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        ctx.startActivity(intent)
                        result.success(true)
                    } catch (ex: Exception) {
                        result.error("BATTERY_ERROR", ex.localizedMessage, null)
                    }
                }
            }

            "queryRawUsageEvents" -> {
                val startTime = (call.argument<Number>("startTime") ?: 0).toLong()
                val endTime = (call.argument<Number>("endTime") ?: System.currentTimeMillis()).toLong()

                val events = AppUsageCollector.queryRawEvents(ctx, startTime, endTime)
                result.success(events)
            }

            "getInstalledApps" -> {
                val apps = AppUsageCollector.getInstalledApps(ctx)
                result.success(apps)
            }

            "startForegroundTimer" -> {
                val title = call.argument<String>("title") ?: "Focus Session"
                val duration = call.argument<Int>("duration") ?: 1800
                val elapsed = call.argument<Int>("elapsed") ?: 0

                val serviceIntent = Intent(ctx, LogMyLifeForegroundService::class.java).apply {
                    action = LogMyLifeForegroundService.ACTION_START
                    putExtra(LogMyLifeForegroundService.EXTRA_TITLE, title)
                    putExtra(LogMyLifeForegroundService.EXTRA_DURATION, duration)
                    putExtra(LogMyLifeForegroundService.EXTRA_ELAPSED, elapsed)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ctx.startForegroundService(serviceIntent)
                } else {
                    ctx.startService(serviceIntent)
                }
                result.success(true)
            }

            "stopForegroundTimer" -> {
                val serviceIntent = Intent(ctx, LogMyLifeForegroundService::class.java).apply {
                    action = LogMyLifeForegroundService.ACTION_STOP
                }
                ctx.startService(serviceIntent)
                result.success(true)
            }

            "showCompletionNotification" -> {
                val title = call.argument<String>("title") ?: "Focus Session"
                val message = call.argument<String>("message") ?: "$title completed!"
                LogMyLifeForegroundService.showCompletionNotification(ctx, title, message)
                result.success(true)
            }

            "hasNotificationPermission" -> {
                val areEnabled = androidx.core.app.NotificationManagerCompat.from(ctx).areNotificationsEnabled()
                result.success(areEnabled)
            }

            "requestNotificationPermission" -> {
                try {
                    val intent = Intent().apply {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                            putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
                        } else {
                            action = "android.settings.APP_NOTIFICATION_SETTINGS"
                            putExtra("app_package", ctx.packageName)
                            putExtra("app_uid", ctx.applicationInfo.uid)
                        }
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    ctx.startActivity(intent)
                    result.success(true)
                } catch (e: Exception) {
                    result.error("NOTIFICATION_PERMISSION_ERROR", e.localizedMessage, null)
                }
            }

            else -> {
                result.notImplemented()
            }
        }
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        channel.setMethodCallHandler(null)
        context = null
    }

    companion object {
        const val METHOD_CHANNEL_NAME = "com.logmylife.app/native_bridge"
        const val EVENT_CHANNEL_NAME = "com.logmylife.app/raw_events"
    }
}
