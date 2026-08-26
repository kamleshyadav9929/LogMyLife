package com.logmylife.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * LogMyLife Persistent Focus Timer Foreground Service
 * Keeps timer active in background, shows live notification updates, and prevents OS killing.
 */
class LogMyLifeForegroundService : Service() {

    private val channelId = "logmylife_focus_timer_channel"
    private val notificationId = 1001
    private var wakeLock: PowerManager.WakeLock? = null
    private var handler: Handler? = null
    private var updateRunnable: Runnable? = null

    private var activityTitle: String = "Focus Session"
    private var durationSeconds: Int = 1800
    private var elapsedSeconds: Int = 0
    private var isRunning: Boolean = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels(this)

        val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
        wakeLock = powerManager?.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "LogMyLife::FocusTimerWakeLock"
        )
        wakeLock?.acquire(120 * 60 * 1000L /* 2 hours max */)

        handler = Handler(Looper.getMainLooper())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        if (action == ACTION_STOP) {
            stopFocusTimer()
            return START_NOT_STICKY
        }

        activityTitle = intent?.getStringExtra(EXTRA_TITLE) ?: "Focus Session"
        durationSeconds = intent?.getIntExtra(EXTRA_DURATION, 1800) ?: 1800
        elapsedSeconds = intent?.getIntExtra(EXTRA_ELAPSED, 0) ?: 0
        isRunning = true

        startForeground(notificationId, buildNotification())
        startTicking()

        return START_STICKY
    }

    private fun startTicking() {
        updateRunnable?.let { handler?.removeCallbacks(it) }
        updateRunnable = object : Runnable {
            override fun run() {
                if (isRunning) {
                    elapsedSeconds++
                    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                    nm?.notify(notificationId, buildNotification())
                    handler?.postDelayed(this, 1000L)
                }
            }
        }
        handler?.postDelayed(updateRunnable!!, 1000L)
    }

    private fun stopFocusTimer() {
        isRunning = false
        updateRunnable?.let { handler?.removeCallbacks(it) }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, LogMyLifeForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStop = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)
        val minutes = remainingSeconds / 60
        val seconds = remainingSeconds % 60
        val timeFormatted = String.format("%02d:%02d", minutes, seconds)

        val contentText = if (remainingSeconds > 0) {
            "⏱️ $timeFormatted remaining • Active focus tracking"
        } else {
            "🎉 Goal reached! Overtime active (+${Math.abs(durationSeconds - elapsedSeconds) / 60}m)"
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("🎯 $activityTitle")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingOpenApp)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Finish & Stop", pendingStop)
            .build()
    }

    override fun onDestroy() {
        isRunning = false
        updateRunnable?.let { handler?.removeCallbacks(it) }
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            // Safe ignore
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val ACTION_START = "com.logmylife.app.ACTION_START_TIMER"
        const val ACTION_STOP = "com.logmylife.app.ACTION_STOP_TIMER"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_DURATION = "extra_duration"
        const val EXTRA_ELAPSED = "extra_elapsed"

        const val CHANNEL_TIMER = "logmylife_focus_timer_channel"
        const val CHANNEL_COMPLETION = "logmylife_completion_channel"
        const val COMPLETION_NOTIFICATION_ID = 2001

        fun createNotificationChannels(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val timerChannel = NotificationChannel(
                    CHANNEL_TIMER,
                    "Focus Timer Live Countdown",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "Live ongoing focus countdown service notification."
                    setShowBadge(false)
                }

                val completionChannel = NotificationChannel(
                    CHANNEL_COMPLETION,
                    "Focus Completion Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alerts and sound notifications when a scheduled focus block or Pomodoro completes."
                    enableVibration(true)
                    setShowBadge(true)
                }

                val manager = context.getSystemService(NotificationManager::class.java)
                manager?.createNotificationChannel(timerChannel)
                manager?.createNotificationChannel(completionChannel)
            }
        }

        fun showCompletionNotification(context: Context, title: String, message: String) {
            createNotificationChannels(context)

            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_COMPLETION)
                .setContentTitle("🎉 NOVI — Focus Complete")
                .setContentText(message.ifEmpty { "$title session finished." })
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .build()

            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.notify(COMPLETION_NOTIFICATION_ID, notification)
        }
    }
}
