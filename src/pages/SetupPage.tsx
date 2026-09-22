import { useMemo, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../app/useAppState';
import { AppChrome } from '../components/AppChrome/AppChrome';
import { GameStage } from '../components/GameStage/GameStage';
import { ENTRY_LIMITS, validateSetup } from '../game/engine/entryValidation';
import type { AnimationSpeed, FakeoutIntensity } from '../game/state/setupTypes';
import styles from './SetupPage.module.css';

const animationSpeedOptions: ReadonlyArray<{ value: AnimationSpeed; label: string }> = [
  { value: 'fast', label: 'Fast' },
  { value: 'normal', label: 'Normal' },
  { value: 'cinematic', label: 'Cinematic' },
];

const fakeoutOptions: ReadonlyArray<{ value: FakeoutIntensity; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'standard', label: 'Standard' },
  { value: 'high', label: 'High' },
];

type BooleanSetupConfigKey =
  'soundEnabled' | 'autoAdvancePhases' | 'showFullSurvivorBoard' | 'allowDuplicateEntries';

function getCountTone(count: number) {
  if (count < ENTRY_LIMITS.hardMinimum) return 'error';
  if (count >= ENTRY_LIMITS.recommendedMinimum && count <= ENTRY_LIMITS.recommendedMaximum) {
    return 'ready';
  }
  return 'warning';
}

export function SetupPage() {
  const { setupDraft, updateSetupConfig, updateSetupDraft } = useAppState();
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const updateBooleanConfig = (key: BooleanSetupConfigKey, checked: boolean) => {
    updateSetupConfig({ [key]: checked });
  };

  return (
    <GameStage label="Capsule Chaos setup screen">
      <div className={styles.page}>
        <AppChrome />
        <form className={styles.shell} onSubmit={handleSubmit} noValidate>
          <div className={styles.introRow}>
            <div>
              <p className="eyebrow">Giveaway control room</p>
              <h1>
                Build the roster. <span>Lock the chaos.</span>
              </h1>
            </div>
            <div className={styles.introMeta}>
              <span>Recommended</span>
              <strong>30–60 players</strong>
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
                onChange={(event) => updateSetupDraft({ rawEntries: event.target.value })}
              />

              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={setupDraft.config.allowDuplicateEntries}
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
                <span className={styles.phaseTag}>Phase 02</span>
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
                        onChange={() => updateSetupConfig({ animationSpeed: option.value })}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className={styles.optionGroup}>
                <legend>Fake-out intensity</legend>
                <div className={styles.segmentedControl}>
                  {fakeoutOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="fakeout-intensity"
                        value={option.value}
                        checked={setupDraft.config.fakeoutIntensity === option.value}
                        onChange={() => updateSetupConfig({ fakeoutIntensity: option.value })}
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
                    onChange={(event) =>
                      updateBooleanConfig('showFullSurvivorBoard', event.target.checked)
                    }
                  />
                  <span>
                    <strong>Survivor board</strong>
                    <small>{setupDraft.config.showFullSurvivorBoard ? 'Full' : 'Compact'}</small>
                  </span>
                </label>
              </div>

              <div className={styles.validationSummary} aria-live="polite">
                {validation.errors.length === 0 && validation.warnings.length === 0 ? (
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
                  disabled={!validation.canStart}
                  aria-describedby="start-help"
                >
                  Start giveaway
                </button>
                <Link className="button buttonSecondary" to="/game">
                  Preview stage
                </Link>
              </div>
              <p className={styles.startHelp} id="start-help">
                Seed locking and game start are added in Phase 03.
              </p>
            </section>
          </div>
        </form>
      </div>
    </GameStage>
  );
}
