/**
 * PlaybackService — Handles remote media control events
 * 
 * This runs in the background even when the app is closed.
 * It responds to lock screen, Dynamic Island, Control Center,
 * and Bluetooth headset controls.
 * 
 * NOTE: RemoteNext and RemotePrevious are handled in AudioPlayerService
 * with mode-aware logic (full-surah vs per-verse). They are NOT
 * duplicated here to avoid conflicts.
 */
import TrackPlayer, { Event } from 'react-native-track-player';

export const PlaybackService = async function () {
    // Lock screen / Control Center play button
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

    // Lock screen / Control Center pause button
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

    // Lock screen seek bar
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        TrackPlayer.seekTo(event.position);
    });

    // Stop button (headphone disconnect, etc.)
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());

    // Handle audio ducking (e.g., phone call interruption)
    TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
        if (event.paused) {
            await TrackPlayer.pause();
        } else if (event.permanent) {
            await TrackPlayer.reset();
        } else {
            await TrackPlayer.play();
        }
    });
};
