import { AssetImage } from './components/AssetImage';
import { useMultiplayerRoom } from './features/room/useMultiplayerRoom';
import { ArcadeSelectScreen } from './screens/ArcadeSelectScreen';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { JoinRoomScreen } from './screens/JoinRoomScreen';
import { LandingScreen } from './screens/LandingScreen';
import { LevelResultScreen } from './screens/LevelResultScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { MiniGameScreen } from './screens/MiniGameScreen';
import { SettingsHelpScreen } from './screens/SettingsHelpScreen';
import { WorldSelectScreen } from './screens/WorldSelectScreen';

export function App() {
  const room = useMultiplayerRoom();
  const localProfile = room.buildLocalProfile();

  const renderScreen = () => {
    switch (room.screen) {
      case 'landing':
        return (
          <LandingScreen
            progression={room.progression}
            noticeBanner={room.noticeBanner}
            onDismissNotice={() => room.setNoticeBanner(null)}
            onGoCreate={() => {
              room.setRoomError(null);
              room.setScreen('create-room');
            }}
            onGoJoin={() => {
              room.setRoomError(null);
              room.setScreen('join-room');
            }}
            onOpenWorldPreview={() => room.setScreen('world-select')}
            onOpenArcadePreview={() => room.setScreen('arcade-select')}
            onOpenSettings={() => room.openSettings('landing')}
          />
        );

      case 'create-room':
        return (
          <CreateRoomScreen
            initialName={room.settings.playerName}
            preferredCharacter={room.settings.preferredCharacter}
            selectedCosmetic={room.progression.selectedCosmetic}
            roomCode={room.roomCode}
            localRelayAvailable={room.localRelayAvailable}
            connectionPreference={room.connectionPreference}
            roomBusy={room.roomBusy}
            roomError={room.roomError}
            transportStatus={room.transportStatus}
            transportDetail={room.transportDetail}
            signalingInfo={room.signalingInfo}
            onChangeConnectionPreference={(mode) => {
              room.setRoomError(null);
              room.setConnectionPreference(mode);
            }}
            onSelectCharacter={room.selectCharacter}
            onCreateRoom={room.createRoom}
            onEnterLobby={() => room.setScreen('lobby')}
            onBack={() => {
              if (room.roomCode) {
                void room.leaveRoom();
              } else {
                room.setRoomError(null);
                room.setScreen('landing');
              }
            }}
          />
        );

      case 'join-room':
        return (
          <JoinRoomScreen
            initialName={room.settings.playerName}
            preferredCharacter={room.settings.preferredCharacter}
            selectedCosmetic={room.progression.selectedCosmetic}
            localRelayAvailable={room.localRelayAvailable}
            connectionPreference={room.connectionPreference}
            roomBusy={room.roomBusy}
            roomError={room.roomError}
            onChangeConnectionPreference={(mode) => {
              room.setRoomError(null);
              room.setConnectionPreference(mode);
            }}
            onSelectCharacter={room.selectCharacter}
            onJoinRoom={room.joinRoom}
            onBack={() => {
              room.setRoomError(null);
              room.setScreen('landing');
            }}
          />
        );

      case 'lobby':
        if (!room.roomCode || !room.role) {
          return (
            <LandingScreen
              progression={room.progression}
              noticeBanner={room.noticeBanner}
              onDismissNotice={() => room.setNoticeBanner(null)}
              onGoCreate={() => room.setScreen('create-room')}
              onGoJoin={() => room.setScreen('join-room')}
              onOpenWorldPreview={() => room.setScreen('world-select')}
              onOpenArcadePreview={() => room.setScreen('arcade-select')}
              onOpenSettings={() => room.openSettings('landing')}
            />
          );
        }
        return (
          <LobbyScreen
            roomCode={room.roomCode}
            role={room.role}
            localPlayer={localProfile}
            remotePlayer={room.remotePlayer}
            ready={room.ready}
            selectedLevelId={room.selectedLevelId}
            selectedTarget={room.selectedTarget}
            progression={room.progression}
            transportStatus={room.transportStatus}
            transportDetail={room.transportDetail}
            signalingInfo={room.signalingInfo}
            roomError={room.roomError}
            noticeBanner={room.noticeBanner}
            onToggleReady={room.toggleReady}
            onSelectCharacter={room.selectCharacter}
            onSelectCosmetic={room.selectCosmetic}
            onOpenWorldSelect={() => room.setScreen('world-select')}
            onOpenArcadeSelect={() => room.setScreen('arcade-select')}
            onStartLevel={() => room.startLevel()}
            onOpenSettings={() => room.openSettings('lobby')}
            onLeaveRoom={() => void room.leaveRoom()}
          />
        );

      case 'world-select':
        return (
          <WorldSelectScreen
            progression={room.progression}
            selectedLevelId={room.selectedLevelId}
            inRoom={Boolean(room.roomCode)}
            isHost={room.role === 'host'}
            onSelectLevel={room.selectLevel}
            onBack={() => room.setScreen(room.roomCode ? 'lobby' : 'landing')}
          />
        );

      case 'arcade-select':
        return (
          <ArcadeSelectScreen
            progression={room.progression}
            selectedTarget={room.selectedTarget}
            inRoom={Boolean(room.roomCode)}
            isHost={room.role === 'host'}
            onSelectArcadeGame={room.selectArcadeGame}
            onBack={() => room.setScreen(room.roomCode ? 'lobby' : 'landing')}
          />
        );

      case 'minigame':
        return (
          <MiniGameScreen
            levelId={room.selectedLevelId}
            target={room.selectedTarget}
            role={room.role ?? 'host'}
            playerAView={room.playerAView}
            snapshot={room.snapshot}
            transportStatus={room.transportStatus}
            signalingInfo={room.signalingInfo}
            onAction={room.sendGameAction}
            onRestart={room.restartCurrentLevel}
            onExitToLobby={room.returnToLobbyFromGame}
          />
        );

      case 'result':
        if (!room.lastOutcome) {
          return null;
        }
        return (
          <LevelResultScreen
            outcome={room.lastOutcome}
            progression={room.progression}
            role={room.role ?? 'host'}
            localCharacter={localProfile.character}
            localCosmetic={localProfile.cosmetic}
            partnerCharacter={
              room.remotePlayer?.character ??
              (localProfile.character === 'boy' ? 'girl' : 'boy')
            }
            partnerCosmetic={room.remotePlayer?.cosmetic ?? 'none'}
            onNextLevel={(nextId) => room.startLevel(nextId)}
            onReplay={room.restartCurrentLevel}
            onOpenArcade={() => room.setScreen('arcade-select')}
            onBackToLobby={room.returnToLobbyFromGame}
          />
        );

      case 'settings':
        return (
          <SettingsHelpScreen
            settings={room.settings}
            progression={room.progression}
            signalingInfo={room.signalingInfo}
            onUpdateSettings={room.updateSettings}
            onResetProgress={room.resetProgress}
            onBack={room.closeSettings}
          />
        );
    }
  };

  return (
    <div
      className={`relative min-h-dvh w-full overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 ${
        room.settings.reducedMotion ? 'reduced-motion' : ''
      }`}
    >
      {/* Soft decorative pastel clouds along bottom edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 opacity-65"
      >
        <AssetImage
          src="/assets/backgrounds/pastel-sky-clouds.svg"
          alt=""
          className="h-36 w-full object-cover object-top sm:h-48"
          fallback={null}
        />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-3xl pb-8">
        <div key={room.screen} className="tboh-screen-enter">
          {renderScreen()}
        </div>
      </main>
    </div>
  );
}

export default App;
