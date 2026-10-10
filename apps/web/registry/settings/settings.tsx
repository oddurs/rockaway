import '@rockaway/tokens/themes/catppuccin.css';
import '@rockaway/tokens/themes/dracula.css';
import '@rockaway/tokens/themes/ice.css';
import '@rockaway/tokens/themes/ink.css';
import '@rockaway/tokens/themes/nord.css';
import '@rockaway/tokens/themes/phosphor.css';
import '@rockaway/tokens/themes/solarized.css';
import '@rockaway/tokens/themes/tokyo-night.css';
import { GlyphProvider } from '@rockaway/react';
import { Button } from '@rockaway/react/button';
import { Checkbox, CheckboxGroup } from '@rockaway/react/checkbox';
import { Dialog } from '@rockaway/react/dialog';
import { Divider } from '@rockaway/react/divider';
import { Form } from '@rockaway/react/field';
import { Fieldset } from '@rockaway/react/fieldset';
import { Keymap, useKeymap } from '@rockaway/react/keymap';
import { Radio, RadioGroup } from '@rockaway/react/radio-group';
import { Select, SelectItem } from '@rockaway/react/select';
import { Switch } from '@rockaway/react/switch';
import { TextField } from '@rockaway/react/text-field';
import { type ThemeName, themeContexts, themeGlyphs } from '@rockaway/tokens';
import { type FormEvent, type ReactNode, useRef, useState } from 'react';
import {
  ACCOUNT,
  changed,
  DENSITIES,
  type Density,
  MODES,
  type Mode,
  NOTIFICATIONS,
  SAVED,
  save,
  type Settings as Values,
} from './settings-data.ts';

export interface SettingsProps {
  /** What the account holds now. */
  readonly initial?: Values;
  /** Called with the settings the server took. */
  readonly onSave?: (settings: Values) => void;
  /** Called when the account is deleted. */
  readonly onDelete?: () => void;
}

/**
 * A settings page (cairn 0151): every field component in a form of framed
 * sections, server-side validation, and a confirmation that asks for the
 * account's name before it deletes anything.
 *
 * Theme, mode, density and motion apply live to the form itself: choosing ink
 * rounds every corner in it while the page around it stays as it was. Copied
 * in, so the sections, the words and what saving does are yours.
 */
export function Settings({ initial = SAVED, onSave, onDelete }: SettingsProps): ReactNode {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = changed(values, saved);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setStatus('');
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!dirty || busy) return;
    setBusy(true);
    setStatus('Saving…');
    const found = await save(values);
    setBusy(false);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus('Not saved: see the fields marked.');
      return;
    }
    setSaved(values);
    setStatus('Saved.');
    onSave?.(values);
  };

  const theme = values.theme as ThemeName;
  return (
    <Keymap>
      <div
        className="settings"
        data-rk-theme={values.theme}
        {...(values.mode === 'system' ? {} : { 'data-theme': values.mode })}
        data-density={values.density}
        data-motion={values.reduceMotion ? 'reduced' : 'full'}
      >
        <GlyphProvider glyphs={themeGlyphs[theme] ?? themeGlyphs.default}>
          <Divider label="Settings" />
          <Form validationErrors={errors} onSubmit={submit}>
            <Fieldset legend="Profile">
              <TextField
                label="Name"
                name="name"
                isRequired
                value={values.name}
                onChange={(name) => set('name', name)}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                isRequired
                description="Where receipts and alerts go."
                value={values.email}
                onChange={(email) => set('email', email)}
              />
            </Fieldset>
            <Fieldset legend="Appearance">
              <Select
                label="Theme"
                name="theme"
                value={values.theme}
                onChange={(key) => set('theme', String(key))}
              >
                {themeContexts.map((t) => (
                  <SelectItem key={t.name} id={t.name}>
                    {t.title}
                  </SelectItem>
                ))}
              </Select>
              <RadioGroup
                label="Mode"
                name="mode"
                orientation="horizontal"
                value={values.mode}
                onChange={(mode) => set('mode', mode as Mode)}
              >
                {MODES.map((mode) => (
                  <Radio key={mode} value={mode}>
                    {mode}
                  </Radio>
                ))}
              </RadioGroup>
              <Select
                label="Density"
                name="density"
                value={values.density}
                onChange={(key) => set('density', String(key) as Density)}
              >
                {DENSITIES.map((density) => (
                  <SelectItem key={density} id={density}>
                    {density}
                  </SelectItem>
                ))}
              </Select>
              <Switch
                isSelected={values.reduceMotion}
                onChange={(reduce) => set('reduceMotion', reduce)}
              >
                Reduce motion
              </Switch>
            </Fieldset>
            <CheckboxGroup
              label="Email me about"
              name="notify"
              value={[...values.notify]}
              onChange={(notify) => set('notify', notify)}
            >
              {NOTIFICATIONS.map((n) => (
                <Checkbox key={n.id} value={n.id}>
                  {n.label}
                </Checkbox>
              ))}
            </CheckboxGroup>
            <Actions
              dirty={dirty}
              busy={busy}
              onSave={() => void submit()}
              onReset={() => {
                setValues(saved);
                setErrors({});
                setStatus('');
              }}
            />
            <p role="status" className="settings-status">
              {status}
            </p>
          </Form>
          <Divider label="Danger" />
          <p>Delete this account, and everything in it. There is no undo.</p>
          <Button variant="danger" onPress={() => setDeleting(true)}>
            Delete account
          </Button>
          <ConfirmDelete
            isOpen={deleting}
            onClose={() => setDeleting(false)}
            onDelete={() => {
              setDeleting(false);
              onDelete?.();
              setStatus('Account deleted.');
            }}
          />
        </GlyphProvider>
      </div>
    </Keymap>
  );
}

/** Save and reset, with Save on `mod+s`. */
function Actions({
  dirty,
  busy,
  onSave,
  onReset,
}: {
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly onSave: () => void;
  readonly onReset: () => void;
}): ReactNode {
  const saveButton = useRef<HTMLButtonElement>(null);
  useKeymap([{ keys: 'mod+s', description: 'Save', action: onSave, target: saveButton }]);
  return (
    <div className="settings-actions">
      <Button isDisabled={!dirty || busy} onPress={onReset}>
        Reset
      </Button>
      <span> </span>
      <Button
        ref={saveButton}
        variant="fill"
        type="submit"
        keys="mod+s"
        isDisabled={!dirty || busy}
      >
        Save
      </Button>
    </div>
  );
}

/** Asks for the account's name, typed back, before Delete does anything. */
function ConfirmDelete({
  isOpen,
  onClose,
  onDelete,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDelete: () => void;
}): ReactNode {
  const [typed, setTyped] = useState('');
  const close = () => {
    setTyped('');
    onClose();
  };
  return (
    <Dialog
      title="Delete account?"
      variant="alert"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      actions={
        <>
          <Button keys="esc" onPress={close}>
            Cancel
          </Button>
          <span> </span>
          <Button
            variant="danger"
            isDisabled={typed !== ACCOUNT}
            onPress={() => {
              setTyped('');
              onDelete();
            }}
          >
            Delete
          </Button>
        </>
      }
    >
      <p>
        Everything in <strong>{ACCOUNT}</strong> goes,
        <br />
        and cannot come back.
      </p>
      <p>Type the account's name to delete it.</p>
      <TextField label="Account" value={typed} onChange={setTyped} autoFocus />
    </Dialog>
  );
}
