import { useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../app/useAppState';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import { ENTRY_LIMITS, validateSetup } from '../game/engine/entryValidation';
import type { AnimationSpeed } from '../game/state/setupTypes';
import styles from './SetupPage.module.css';

const animationSpeedOptions: ReadonlyArray<{ value: AnimationSpeed; label: string }> = [
  { value: 'fast', label: 'Fast' },
  { value: 'normal', label: 'Normal' },
  { value: 'cinematic', label: 'Cinematic' },
];

type BooleanSetupConfigKey =
  | 'soundEnabled'
  | 'autoAdvancePhases'
  | 'showFullSurvivorBoard'
  | 'allowDuplicateEntries'
  | 'reducedMotion';

function getCountTone(count: number) {
  if (count < ENTRY_LIMITS.hardMinimum) return 'error';
  if (count >= ENTRY_LIMITS.recommendedMinimum && count <= ENTRY_LIMITS.recommendedMaximum) {
    return 'ready';
  }
  return 'warning';
}

export function SetupPage() {
  const navigate = useNavigate();
  const {
    gameSession,
    lockError,
    lockStatus,
    setupDraft,
    startGame,
    updateSetupConfig,
    updateSetupDraft,
    recoveryAvailable,
    resumeGame,
    abandonSession,
    legacySessionJson,
    rejectedRecoveryJson,
    dismissLegacySession,
    storageStatus,
  } = useAppState();
  const validation = useMemo(
    () =>
      validateSetup(
        setupDraft.giveawayName,
        setupDraft.rawEntries,
        setupDraft.config.allowDuplicateEntries,
      ),
    [setupDraft.config.allowDuplicateEntries, setupDraft.giveawayName, setupDraft.rawEntries],
  );
  const countTone = getCountTone(validation.roster.length);
  const controlsDisabled = Boolean(gameSession) || lockStatus === 'locking';

  const lockAndNavigate = async () => {
    if (await startGame()) await navigate('/game');
  };
  const resumeAndNavigate = async () => {
    if (resumeGame()) await navigate('/game');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void lockAndNavigate();
  };

  const updateBooleanConfig = (key: BooleanSetupConfigKey, checked: boolean) => {
    updateSetupConfig({ [key]: checked });
  };

  const downloadJson = (json: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GameStage label="Capsule Chaos setup screen">
      <div className={styles.page}>
        <AppChrome />
        {recoveryAvailable && (
          <aside className={styles.recovery} aria-label="Active giveaway found">
            <div>
              <strong>Active giveaway found</strong>
              <span>Resume the exact locked seed, timeline, and official result.</span>
            </div>
            <button className="button buttonPrimary" onClick={() => void resumeAndNavigate()}>
              Resume giveaway
            </button>
            <button className="button buttonSecondary" onClick={abandonSession}>
              Abandon session
            </button>
          </aside>
        )}
        {legacySessionJson && !recoveryAvailable && (
          <aside className={styles.recovery} aria-label="Previous-rules session found">
            <div>
              <strong>A previous-rules session is saved. This version cannot resume it.</strong>
              <span>The original bytes will remain untouched in local storage.</span>
            </div>
            <button
              className="button buttonSecondary"
              onClick={() =>
                downloadJson(legacySessionJson, 'capsule-chaos-previous-rules-session.json')
              }
            >
              Download previous session JSON
            </button>
            <button className="button buttonPrimary" onClick={dismissLegacySession}>
              Start a new Breakout
            </button>
          </aside>
        )}
        {rejectedRecoveryJson && (
          <aside className={styles.recovery} aria-label="Unrecoverable Breakout found">
            <div>
              <strong>{lockError ?? 'A saved Breakout could not be verified.'}</strong>
              <span>Download the saved bytes before abandoning this recovery record.</span>
            </div>
            <button
              className="button buttonSecondary"
              onClick={() =>
                downloadJson(rejectedRecoveryJson, 'capsule-chaos-unverified-recovery.json')
              }
            >
              Download saved session JSON
            </button>
            <button className="button buttonPrimary" onClick={abandonSession}>
              Abandon saved Breakout
            </button>
          </aside>
        )}
        <form className={styles.shell} onSubmit={handleSubmit} noValidate>
          <div className={styles.introRow}>
            <div>
              <p className="eyebrow">Giveaway control room</p>
              <h1>
                Build the roster. <span>Lock the chaos.</span>
              </h1>
            </div>
            <div className={styles.introMeta}>
              <span>Breakout format</span>
              <strong>1–1000+ entries supported</strong>
              <p>Names are case-sensitive. Unicode-equivalent spellings count as duplicates.</p>
            </div>
          </div>

          <div className={styles.workspace}>
            <section className={styles.panel} aria-labelledby="roster-heading">
              <div className={styles.panelHeader}>
                <div>
                  <p>Step 01</p>
                  <h2 id="roster-heading">Giveaway roster</h2>
                </div>
                <div className={`${styles.countBadge} ${styles[countTone]}`} aria-live="polite">
                  <strong>{validation.roster.length}</strong>
                  <span>valid entries</span>
                </div>
              </div>

              <label className={styles.fieldLabel} htmlFor="giveaway-name">
                Giveaway name
              </label>
              <input
                id="giveaway-name"
                className={styles.textInput}
                type="text"
                value={setupDraft.giveawayName}
                placeholder="September Capsule Chaos"
                autoComplete="off"
                disabled={controlsDisabled}
                onChange={(event) => updateSetupDraft({ giveawayName: event.target.value })}
              />

              <div className={styles.entriesLabelRow}>
                <label className={styles.fieldLabel} htmlFor="entries">
                  Entries
                </label>
                <span>One in-game name per line</span>
              </div>
              <textarea
                id="entries"
                className={styles.entriesTextarea}
                value={setupDraft.rawEntries}
                placeholder={'DemonBlade\nLightBringer\nNightFox\nHaru'}
                spellCheck={false}
                disabled={controlsDisabled}
                onChange={(event) => updateSetupDraft({ rawEntries: event.target.value })}
              />

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={setupDraft.config.allowDuplicateEntries}
                  disabled={controlsDisabled}
                  onChange={(event) =>
                    updateBooleanConfig('allowDuplicateEntries', event.target.checked)
                  }
                />
                <span>
                  <strong>Allow duplicate entries</strong>
                  <small>Repeated names stay separate players with unique internal IDs.</small>
                </span>
              </label>

              {validation.duplicates.length > 0 && (
                <div className={styles.duplicatePanel} aria-label="Duplicate names">
                  <strong>Duplicate {validation.duplicates.length === 1 ? 'name' : 'names'}</strong>
                  <ul>
                    {validation.duplicates.map((group) => (
                      <li key={group.normalizedName}>
                        <span>{group.displayNames[0]}</span>
                        <small>lines {group.sourceLineNumbers.join(', ')}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="options-heading">
              <div className={styles.panelHeader}>
                <div>
                  <p>Step 02</p>
                  <h2 id="options-heading">Show settings</h2>
                </div>
                <span className={styles.phaseTag}>Three acts</span>
              </div>

              <fieldset className={styles.optionGroup}>
                <legend>Animation speed</legend>
                <div className={styles.segmentedControl}>
                  {animationSpeedOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="animation-speed"
                        value={option.value}
                        checked={setupDraft.config.animationSpeed === option.value}
                        disabled={controlsDisabled}
                        onChange={() => updateSetupConfig({ animationSpeed: option.value })}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={styles.toggleGrid}>
                <label className={styles.toggleCard}>
                  <input
                    type="checkbox"
                    checked={setupDraft.config.soundEnabled}
                    disabled={controlsDisabled}
                    onChange={(event) => updateBooleanConfig('soundEnabled', event.target.checked)}
                  />
                  <span>
                    <strong>Sound</strong>
                    <small>{setupDraft.config.soundEnabled ? 'On' : 'Off'}</small>
                  </span>
                </label>
                <label className={styles.toggleCard}>
                  <input
                    type="checkbox"
                    checked={setupDraft.config.autoAdvancePhases}
                    disabled={controlsDisabled}
                    onChange={(event) =>
                      updateBooleanConfig('autoAdvancePhases', event.target.checked)
                    }
                  />
                  <span>
                    <strong>Auto advance</strong>
                    <small>{setupDraft.config.autoAdvancePhases ? 'On' : 'Off'}</small>
                  </span>
                </label>
                <label className={styles.toggleCard}>
                  <input
                    type="checkbox"
                    checked={setupDraft.config.showFullSurvivorBoard}
                    disabled={controlsDisabled}
                    onChange={(event) =>
                      updateBooleanConfig('showFullSurvivorBoard', event.target.checked)
                    }
                  />
                  <span>
                    <strong>Survivor board</strong>
                    <small>{setupDraft.config.showFullSurvivorBoard ? 'Full' : 'Compact'}</small>
                  </span>
                </label>
                <label className={styles.toggleCard}>
                  <input
                    type="checkbox"
                    checked={setupDraft.config.reducedMotion}
                    disabled={controlsDisabled}
                    onChange={(event) => updateBooleanConfig('reducedMotion', event.target.checked)}
                  />
                  <span>
                    <strong>Reduced motion</strong>
                    <small>{setupDraft.config.reducedMotion ? 'On' : 'Off'}</small>
                  </span>
                </label>
              </div>

              <div className={styles.validationSummary} aria-live="polite">
                {storageStatus === 'unavailable' && (
                  <p className={styles.warningMessage}>
                    Refresh recovery unavailable — the locked session remains downloadable in-game.
                  </p>
                )}
                {lockError ? (
                  <p className={styles.errorMessage}>{lockError}</p>
                ) : validation.errors.length === 0 && validation.warnings.length === 0 ? (
                  <p className={styles.successMessage}>Roster is in the recommended range.</p>
                ) : (
                  <ul>
                    {validation.errors.map((issue) => (
                      <li className={styles.errorMessage} key={issue.code}>
                        <span aria-hidden="true">!</span>
                        {issue.message}
                      </li>
                    ))}
                    {validation.warnings.map((issue) => (
                      <li className={styles.warningMessage} key={issue.code}>
                        <span aria-hidden="true">i</span>
                        {issue.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  className="button buttonPrimary"
                  type="submit"
                  disabled={!validation.canStart || controlsDisabled}
                  aria-describedby="start-help"
                >
                  {lockStatus === 'locking' ? 'Locking game…' : 'Start giveaway'}
                </button>
                <Link className="button buttonSecondary" to="/game">
                  Preview stage
                </Link>
              </div>
              <p className={styles.startHelp} id="start-help">
                Start securely locks this roster and precomputes the complete three-act outcome.
              </p>
            </section>
          </div>
        </form>
      </div>
    </GameStage>
  );
}
