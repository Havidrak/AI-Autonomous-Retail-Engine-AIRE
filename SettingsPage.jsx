import { useEffect, useState } from 'react'
import {
  IconAlert,
  IconBox,
  IconCheck,
  IconDatabase,
  IconGear,
  IconSparkSmall,
  IconTarget,
  IconTrend,
  IconUser,
} from './Icons.jsx'

const storageKey = 'aire-settings-v1'

const defaultSettings = {
  forecastHorizon: '30 days',
  modelMode: 'SARIMAX primary',
  confidenceLevel: '95%',
  cacheForecasts: true,
  validateBeforeForecast: true,
  compactCards: true,
  reduceAnimations: false,
  autosaveCleanedData: true,
  uploadLimit: '20 MB',
  currency: 'RM',
}

export default function SettingsPage({ dataset, executedForecast, user, topRef }) {
  const [settings, setSettings] = useState(() => readStoredSettings())

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const datasetReady = Boolean(dataset?.rows?.length)
  const forecastReady = Boolean(executedForecast?.model)
  const healthItems = [
    {
      label: 'Account',
      value: user ? 'Signed in' : 'Guest mode',
      tone: user ? 'ready' : 'warning',
      icon: <IconUser />,
    },
    {
      label: 'Dataset',
      value: datasetReady ? `${dataset.rows.length.toLocaleString()} rows loaded` : 'No dataset loaded',
      tone: datasetReady ? 'ready' : 'warning',
      icon: <IconDatabase />,
    },
    {
      label: 'Forecast Model',
      value: forecastReady
        ? executedForecast.model?.modelInfo?.method ?? 'Model ready'
        : 'Waiting for forecast',
      tone: forecastReady ? 'ready' : 'warning',
      icon: <IconTrend />,
    },
  ]

  return (
    <div className="settings-page" ref={topRef}>
      <header className="settings-hero">
        <span>System Settings</span>
        <p>
          Control how AIRE handles uploaded datasets, forecast execution, dashboard display, and
          model output for retail analysis.
        </p>
      </header>

      <section className="settings-health-grid" aria-label="System health">
        {healthItems.map((item) => (
          <article className={`settings-health-card ${item.tone}`} key={item.label}>
            <div className="settings-icon">{item.icon}</div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="settings-layout">
        <div className="settings-column">
          <article className="settings-card">
            <SettingsCardHeader
              icon={<IconTrend />}
              title="Forecast Settings"
              description="Configure model execution and forecast output."
            />
            <div className="settings-field-grid">
              <SelectField
                label="Forecast Horizon"
                value={settings.forecastHorizon}
                options={['7 days', '30 days', 'Monthly']}
                onChange={(value) => updateSetting('forecastHorizon', value)}
              />
              <SelectField
                label="Model Mode"
                value={settings.modelMode}
                options={['SARIMAX primary', 'Random Forest fallback', 'Fast trend mode']}
                onChange={(value) => updateSetting('modelMode', value)}
              />
              <SelectField
                label="Confidence Level"
                value={settings.confidenceLevel}
                options={['90%', '95%', '99%']}
                onChange={(value) => updateSetting('confidenceLevel', value)}
              />
              <SelectField
                label="Currency"
                value={settings.currency}
                options={['RM', 'USD', 'SGD']}
                onChange={(value) => updateSetting('currency', value)}
              />
            </div>
            <div className="settings-toggle-list">
              <ToggleField
                label="Cache forecast results"
                description="Reuse the latest model output for the same dataset."
                checked={settings.cacheForecasts}
                onChange={(checked) => updateSetting('cacheForecasts', checked)}
              />
              <ToggleField
                label="Validate data before forecast"
                description="Check date, product, sales, and quantity fields before execution."
                checked={settings.validateBeforeForecast}
                onChange={(checked) => updateSetting('validateBeforeForecast', checked)}
              />
            </div>
          </article>

          <article className="settings-card">
            <SettingsCardHeader
              icon={<IconDatabase />}
              title="Data Management"
              description="Set upload and cleaned-data behavior."
            />
            <div className="settings-field-grid">
              <SelectField
                label="Upload Limit"
                value={settings.uploadLimit}
                options={['10 MB', '20 MB', '50 MB']}
                onChange={(value) => updateSetting('uploadLimit', value)}
              />
              <div className="settings-readout">
                <span>Current Dataset</span>
                <strong>{datasetReady ? dataset.fileName : 'Not loaded'}</strong>
                <small>
                  {datasetReady
                    ? `${dataset.columns?.length ?? 0} columns available`
                    : 'Upload a dataset from Data Management'}
                </small>
              </div>
            </div>
            <div className="settings-toggle-list">
              <ToggleField
                label="Autosave cleaned datasets"
                description="Keep the cleaned version available in upload history."
                checked={settings.autosaveCleanedData}
                onChange={(checked) => updateSetting('autosaveCleanedData', checked)}
              />
            </div>
          </article>
        </div>

        <div className="settings-column">
          <article className="settings-card">
            <SettingsCardHeader
              icon={<IconGear />}
              title="Display Preferences"
              description="Tune the interface for presentation and daily usage."
            />
            <div className="settings-toggle-list">
              <ToggleField
                label="Compact dashboard cards"
                description="Keep cards tighter so pages do not stretch too much."
                checked={settings.compactCards}
                onChange={(checked) => updateSetting('compactCards', checked)}
              />
              <ToggleField
                label="Reduce interface animation"
                description="Use calmer transitions for slower laptops."
                checked={settings.reduceAnimations}
                onChange={(checked) => updateSetting('reduceAnimations', checked)}
              />
            </div>
          </article>

          <article className="settings-card settings-card-accent">
            <SettingsCardHeader
              icon={<IconSparkSmall />}
              title="AIRE Configuration"
              description="Current analysis setup used by the system."
            />
            <div className="settings-status-list">
              <StatusRow icon={<IconCheck />} label="Primary model" value="SARIMAX" />
              <StatusRow icon={<IconBox />} label="Fallback model" value="Random Forest" />
              <StatusRow icon={<IconTarget />} label="Evaluation" value="RMSE, MAE, MAPE" />
              <StatusRow
                icon={<IconAlert />}
                label="Recommendation source"
                value="Forecast output and business rules"
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

function SettingsCardHeader({ icon, title, description }) {
  return (
    <div className="settings-card-head">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="settings-icon">{icon}</div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleField({ label, description, checked, onChange }) {
  return (
    <label className="settings-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

function StatusRow({ icon, label, value }) {
  return (
    <div className="settings-status-row">
      <div className="settings-status-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function readStoredSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return { ...defaultSettings, ...stored }
  } catch {
    return defaultSettings
  }
}
