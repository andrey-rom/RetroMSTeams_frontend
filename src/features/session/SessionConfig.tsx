import { useMemo, useState } from "react";
import { useCreateSessionMutation, useTemplatesQuery } from "./hooks/useSessionConfig.ts";
import styles from "./SessionConfig.module.css";
import { getPreviewByTemplate, getTemplateIcon, mapMinutesToSeconds } from "./helpers.ts";

interface SessionConfigProps {
  onSessionOpen: (sessionId: string) => void;
}

export default function SessionConfig({ onSessionOpen }: SessionConfigProps) {
  const { data: templates = [], error, isLoading } = useTemplatesQuery();
  const createSessionMutation = useCreateSessionMutation();

  const [title, setTitle] = useState("Sprint 14 Retrospective");
  const [collectMinutes, setCollectMinutes] = useState("10");
  const [voteMinutes, setVoteMinutes] = useState("5");
  const [selectedTemplateId, setSelectedTemplateId] = useState<null | string>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? templates[0],
    [selectedTemplateId, templates],
  );
  const previewColumns = getPreviewByTemplate(selectedTemplate);

  const handleSubmit = async () => {
    if (!selectedTemplate || !title.trim() || createSessionMutation.isPending) {
      return;
    }

    try {
      const created = await createSessionMutation.mutateAsync({
        collectTimerSeconds: mapMinutesToSeconds(collectMinutes),
        maxVotesPerUser: 99,
        msChannelId: "string",
        msTeamsId: "string",
        templateTypeId: selectedTemplate.id,
        title: title.trim(),
        voteTimerSeconds: mapMinutesToSeconds(voteMinutes),
      });

      onSessionOpen(created.id);
    } catch {
      // Errors are displayed below from mutation state.
    }
  };

  return (
    <div className={styles.configContent}>
      <div className={styles.configForm}>
        <div className={styles.configHero}>
          <div className={styles.configHeroIcon}>
            <i className="fas fa-plus" />
          </div>
          <h1>New Retrospective</h1>
          <p>Set up a session for your team to reflect and improve</p>
        </div>
        {isLoading && <p>Loading templates...</p>}
        {error && <p className={styles.errorText}>Failed to load templates.</p>}
        {!isLoading && templates.length > 0 && (
          <>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Session Name</label>
              <input
                className={styles.formInput}
                placeholder="e.g., Sprint 14 Retrospective"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className={styles.formHint}>This name will be visible to all participants</div>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Choose Template</label>
              <div className={styles.templateGrid}>
                {templates.map((template) => {
                  const isSelected = template.id === selectedTemplate?.id;

                  return (
                    <div
                      key={template.id}
                      className={`${styles.templateCard} ${isSelected ? styles.templateCardSelected : ""}`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className={styles.templateCheck}>
                        <i className="fas fa-check" />
                      </div>
                      <div className={styles.templateIcon}>{getTemplateIcon(template)}</div>
                      <div className={styles.templateName}>{template.name}</div>
                      <div className={styles.templateColumns}>{template.description || "Retrospective template"}</div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.previewPanel}>
                <div className={styles.previewTitle}>Board Preview</div>
                <div className={styles.previewColumns}>
                  {previewColumns.map((column, index) => (
                    <div key={`${column.text}-${index}`} className={`${styles.previewCol} ${styles[column.tone]}`}>
                      {column.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Phase Duration</label>
              <div className={styles.timerSettings}>
                <div className={styles.timerSetting}>
                  <div className={styles.timerSettingLabel}>
                    <i className="fas fa-pen-to-square" /> Collect Phase
                  </div>
                  <div className={styles.timerInputRow}>
                    <input
                      className={styles.timerInput}
                      max={60}
                      min={1}
                      type="number"
                      value={collectMinutes}
                      onChange={(event) => setCollectMinutes(event.target.value)}
                    />
                    <span className={styles.timerUnit}>minutes</span>
                  </div>
                </div>
                <div className={styles.timerSetting}>
                  <div className={styles.timerSettingLabel}>
                    <i className="fas fa-thumbs-up" /> Vote Phase
                  </div>
                  <div className={styles.timerInputRow}>
                    <input
                      className={styles.timerInput}
                      max={30}
                      min={1}
                      type="number"
                      value={voteMinutes}
                      onChange={(event) => setVoteMinutes(event.target.value)}
                    />
                    <span className={styles.timerUnit}>minutes</span>
                  </div>
                </div>
              </div>
              <div className={styles.formHint} style={{ marginTop: "8px" }}>
                Timer can be paused or extended during the session
              </div>
            </div>
            {createSessionMutation.error && <p className={styles.errorText}>{createSessionMutation.error.message}</p>}
            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
                disabled={!title.trim() || createSessionMutation.isPending}
                type="button"
                onClick={handleSubmit}
              >
                <i aria-hidden className="fas fa-play" />
                {createSessionMutation.isPending ? "Starting..." : "Start Session"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
