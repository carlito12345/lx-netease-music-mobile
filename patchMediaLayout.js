const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'node_modules/react-native-track-player/android/src/main/java/com/guichaguri/trackplayer/service/metadata/MetadataManager.java');

try {
    let buf = fs.readFileSync(file);
    let str = buf.toString('utf8');

    if (str.includes('ACTION_REWIND') && str.includes('ACTION_SKIP_TO_PREVIOUS')) {
        // We aim to swap:
        // addAction(previousAction, PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS, compact);
        // addAction(rewindAction, PlaybackStateCompat.ACTION_REWIND, compact);

        // With regex to handle any newline (\r, \n, \r\n), any spaces
        let regex = /(addAction\(previousAction,\s*PlaybackStateCompat\.ACTION_SKIP_TO_PREVIOUS,\s*compact\);)([\s\r\n]*)(addAction\(rewindAction,\s*PlaybackStateCompat\.ACTION_REWIND,\s*compact\);)/g;

        if (regex.test(str)) {
            console.log('Found the lines to swap. Doing replacement...');
            str = str.replace(regex, "$3$2$1");
            fs.writeFileSync(file, str, 'utf8');
            console.log('Successfully swapped REWIND and SKIP_TO_PREVIOUS lines in java file.');
        } else {
            console.log('Regex did not match. Let me check if they are already swapped.');
            let regexSwapped = /(addAction\(rewindAction,\s*PlaybackStateCompat\.ACTION_REWIND,\s*compact\);)([\s\r\n]*)(addAction\(previousAction,\s*PlaybackStateCompat\.ACTION_SKIP_TO_PREVIOUS,\s*compact\);)/g;
            if (regexSwapped.test(str)) {
                console.log('They are ALREADY swapped!');
            } else {
                console.log('Could not find the lines at all. Here is a snippet around addAction:');
                let index = str.indexOf('addAction(');
                console.log(str.substring(index - 50, index + 300));
            }
        }
    } else {
        console.log('File does not contain expected ACTION strings.');
    }

    if (!str.includes('setShowWhen(false)')) {
        let target = 'builder = new NotificationCompat.Builder(service, channel);';
        if (str.includes(target)) {
            str = str.replace(target, 'builder = new NotificationCompat.Builder(service, channel).setShowWhen(false).setColorized(false);');
            console.log('Successfully removed timestamp from notification.');
            fs.writeFileSync(file, str, 'utf8');
        } else {
            let fallback = 'builder.setSmallIcon(R.drawable.play);';
            if (str.includes(fallback)) {
                str = str.replace(fallback, fallback + '\\n        builder.setShowWhen(false);\\n        builder.setColorized(false);');
                console.log('Patched via fallback setSmallIcon to remove timestamp');
                fs.writeFileSync(file, str, 'utf8');
            }
        }
    } else {
        console.log('Timestamp already removed!');
    }

    if (str.includes('setColorized(true)')) {
        str = str.replace(/setColorized\(true\)/g, 'setColorized(false)');
        console.log('Disabled media notification colorization.');
        fs.writeFileSync(file, str, 'utf8');
    }

    if (!str.includes('setColorized(false)')) {
        let showWhenTarget = 'setShowWhen(false);';
        if (str.includes(showWhenTarget)) {
            str = str.replace(showWhenTarget, 'setShowWhen(false).setColorized(false);');
            console.log('Successfully disabled media notification colorization.');
            fs.writeFileSync(file, str, 'utf8');
        } else {
            let fallback = 'builder.setCategory(NotificationCompat.CATEGORY_TRANSPORT);';
            if (str.includes(fallback)) {
                str = str.replace(fallback, fallback + '\\n        builder.setColorized(false);');
                console.log('Patched via category fallback to disable media notification colorization.');
                fs.writeFileSync(file, str, 'utf8');
            }
        }
    } else {
        console.log('Media notification colorization already disabled!');
    }

    if (str.includes('withNotificationTextColor(') || str.includes('METADATA_KEY_DISPLAY_TITLE')) {
        str = str
            .replace(/import static android\.support\.v4\.media\.MediaMetadataCompat\.METADATA_KEY_DISPLAY_TITLE;\r?\n/g, '')
            .replace(/import static android\.support\.v4\.media\.MediaMetadataCompat\.METADATA_KEY_DISPLAY_SUBTITLE;\r?\n/g, '')
            .replace(/import static android\.support\.v4\.media\.MediaMetadataCompat\.METADATA_KEY_DISPLAY_DESCRIPTION;\r?\n/g, '')
            .replace(/import android\.content\.res\.Configuration;\r?\n/g, '')
            .replace(/import android\.graphics\.Color;\r?\n/g, '')
            .replace(/import android\.text\.SpannableString;\r?\n/g, '')
            .replace(/import android\.text\.Spanned;\r?\n/g, '')
            .replace(/import android\.text\.style\.ForegroundColorSpan;\r?\n/g, '')
            .replace(/\n    private int getNotificationTextColor\(\) \{[\s\S]*?    private CharSequence withNotificationTextColor\(String text\) \{[\s\S]*?    \}\n\n    public MediaSessionCompat getSession\(\) \{/,
                '\n    public MediaSessionCompat getSession() {')
            .replace(/        metadata\.putText\(METADATA_KEY_DISPLAY_TITLE, withNotificationTextColor\(track\.title\)\);\r?\n/g, '')
            .replace(/        metadata\.putText\(METADATA_KEY_DISPLAY_SUBTITLE, withNotificationTextColor\(track\.artist\)\);\r?\n/g, '')
            .replace(/        metadata\.putText\(METADATA_KEY_DISPLAY_DESCRIPTION, withNotificationTextColor\(track\.album\)\);\r?\n/g, '')
            .replace(/      metadata\.putText\(METADATA_KEY_DISPLAY_TITLE, withNotificationTextColor\(title\)\);\r?\n/g, '')
            .replace(/      metadata\.putText\(METADATA_KEY_DISPLAY_SUBTITLE, withNotificationTextColor\(artist\)\);\r?\n/g, '')
            .replace(/      metadata\.putText\(METADATA_KEY_DISPLAY_DESCRIPTION, withNotificationTextColor\(album\)\);\r?\n/g, '')
            .replace(/metadata\.putText\(METADATA_KEY_TITLE, withNotificationTextColor\(track\.title\)\);/g, 'metadata.putString(METADATA_KEY_TITLE, track.title);')
            .replace(/metadata\.putText\(METADATA_KEY_ARTIST, withNotificationTextColor\(track\.artist\)\);/g, 'metadata.putString(METADATA_KEY_ARTIST, track.artist);')
            .replace(/metadata\.putText\(METADATA_KEY_ALBUM, withNotificationTextColor\(track\.album\)\);/g, 'metadata.putString(METADATA_KEY_ALBUM, track.album);')
            .replace(/metadata\.putText\(METADATA_KEY_TITLE, withNotificationTextColor\(title\)\);/g, 'metadata.putString(METADATA_KEY_TITLE, title);')
            .replace(/metadata\.putText\(METADATA_KEY_ARTIST, withNotificationTextColor\(artist\)\);/g, 'metadata.putString(METADATA_KEY_ARTIST, artist);')
            .replace(/metadata\.putText\(METADATA_KEY_ALBUM, withNotificationTextColor\(album\)\);/g, 'metadata.putString(METADATA_KEY_ALBUM, album);')
            .replace(/builder\.setContentTitle\(withNotificationTextColor\(track\.title\)\);/g, 'builder.setContentTitle(track.title);')
            .replace(/builder\.setContentText\(withNotificationTextColor\(track\.artist\)\);/g, 'builder.setContentText(track.artist);')
            .replace(/builder\.setSubText\(withNotificationTextColor\(track\.album\)\);/g, 'builder.setSubText(track.album);');
        console.log('Removed unreliable notification text color span patch.');
        fs.writeFileSync(file, str, 'utf8');
    } else {
        console.log('Notification text color span patch is not present.');
    }

} catch (e) {
    console.error("Error patching java file:", e.message);
}

// ---- Android 14+ FGS 类型修补: track-player MusicService 缺少 foregroundServiceType ----
// MissingForegroundServiceTypeException: Starting FGS without a type (API 34+)
try {
  const manifestPath = path.join(__dirname, 'node_modules/react-native-track-player/android/src/main/AndroidManifest.xml')
  let manifestStr = fs.readFileSync(manifestPath, 'utf8')

  if (!manifestStr.includes('FOREGROUND_SERVICE_MEDIA_PLAYBACK')) {
    manifestStr = manifestStr.replace(
      '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
      '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />'
    )
  }
  if (!manifestStr.includes('foregroundServiceType="mediaPlayback"')) {
    manifestStr = manifestStr.replace(
      '<service android:name=".service.MusicService"',
      '<service android:name=".service.MusicService" android:foregroundServiceType="mediaPlayback"'
    )
  }
  fs.writeFileSync(manifestPath, manifestStr, 'utf8')
  console.log('Patched track-player AndroidManifest.xml: added FOREGROUND_SERVICE_MEDIA_PLAYBACK + foregroundServiceType=mediaPlayback')
} catch (e) {
  console.error('Error patching track-player manifest:', e.message)
}

// ---- Android 12+ (S+) PendingIntent FLAG 修补 ----
// Targeting S+ requires FLAG_IMMUTABLE or FLAG_MUTABLE when creating PendingIntent
try {
  const metadataPath = path.join(__dirname, 'node_modules/react-native-track-player/android/src/main/java/com/guichaguri/trackplayer/service/metadata/MetadataManager.java')
  let metadataStr = fs.readFileSync(metadataPath, 'utf8')

  if (metadataStr.includes('PendingIntent.FLAG_CANCEL_CURRENT)') && !metadataStr.includes('FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE')) {
    metadataStr = metadataStr.replace(
      'PendingIntent.FLAG_CANCEL_CURRENT)',
      'PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE)'
    )
    fs.writeFileSync(metadataPath, metadataStr, 'utf8')
    console.log('Patched MetadataManager.java: added FLAG_IMMUTABLE to PendingIntent')
  } else {
    console.log('MetadataManager PendingIntent already patched or not found.')
  }
} catch (e) {
  console.error('Error patching MetadataManager.java:', e.message)
}

// ---- react-native-exception-handler DefaultErrorScreen RELAUNCH PendingIntent FLAG 修补 ----
// Android 12+ 点击错误弹窗 RELAUNCH 按钮需要 FLAG_IMMUTABLE
try {
  const errScreenPath = path.join(__dirname, 'node_modules/react-native-exception-handler/android/src/main/java/com/masteratul/exceptionhandler/DefaultErrorScreen.java')
  let errScreenStr = fs.readFileSync(errScreenPath, 'utf8')

  if (errScreenStr.includes('PendingIntent.FLAG_CANCEL_CURRENT)') && !errScreenStr.includes('FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE')) {
    errScreenStr = errScreenStr.replace(
      'PendingIntent.FLAG_CANCEL_CURRENT)',
      'PendingIntent.FLAG_CANCEL_CURRENT | PendingIntent.FLAG_IMMUTABLE)'
    )
    fs.writeFileSync(errScreenPath, errScreenStr, 'utf8')
    console.log('Patched DefaultErrorScreen.java: added FLAG_IMMUTABLE to RELAUNCH PendingIntent')
  } else {
    console.log('DefaultErrorScreen PendingIntent already patched or not found.')
  }
} catch (e) {
  console.error('Error patching DefaultErrorScreen.java:', e.message)
}
