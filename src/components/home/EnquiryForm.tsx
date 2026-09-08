'use client';

import type { ChangeEvent, FocusEvent, FormEvent, ReactNode } from 'react';
import { useId, useState } from 'react';
import { SubmissionError, submitEnquiry } from '@/lib/api';
import { LOCATIONS } from '@/data/pricing';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/ui/Section';
import { SplitHeading } from '@/components/ui/SplitHeading';
import styles from './EnquiryForm.module.css';

const FIELD_NAMES = ['name', 'phone', 'email', 'location', 'projectType', 'message'] as const;
const REQUIRED_FIELD_NAMES = ['name', 'phone', 'email', 'location', 'projectType'] as const;
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnquiryField = (typeof FIELD_NAMES)[number];
type EnquiryValues = Record<EnquiryField, string>;
type ValidationErrors = Partial<Record<EnquiryField, string>>;
type TouchedFields = Partial<Record<EnquiryField, boolean>>;
type FieldCopy = Record<EnquiryField, string>;

export type EnquiryFormContent = {
  title: string;
  body: string;
  labels: FieldCopy;
  placeholders: FieldCopy;
  helpers: FieldCopy;
  projectTypes: readonly string[];
  otherLocationLabel: string;
  submitLabel: string;
  submittingLabel: string;
  errors: {
    nameRequired: string;
    nameTooShort: string;
    phoneRequired: string;
    phoneInvalid: string;
    emailRequired: string;
    emailInvalid: string;
    locationRequired: string;
    projectTypeRequired: string;
    submission: string;
  };
  success: {
    title: string;
    body: string;
  };
};

export type EnquiryFormVariant = 'home' | 'page';

type EnquiryFormProps = {
  content: EnquiryFormContent;
  variant?: EnquiryFormVariant;
};

type FieldShellProps = {
  children: ReactNode;
  error?: string;
  helper: string;
  id: string;
  label: string;
};

const INITIAL_VALUES: EnquiryValues = {
  name: '',
  phone: '',
  email: '',
  location: '',
  projectType: '',
  message: '',
};

const ALL_REQUIRED_FIELDS_TOUCHED: TouchedFields = {
  name: true,
  phone: true,
  email: true,
  location: true,
  projectType: true,
};

function isEnquiryField(value: string): value is EnquiryField {
  return FIELD_NAMES.some((field) => field === value);
}

function validate(values: EnquiryValues, errors: EnquiryFormContent['errors']): ValidationErrors {
  const validationErrors: ValidationErrors = {};
  const name = values.name.trim();
  const phone = values.phone;
  const email = values.email;

  if (name.length === 0) {
    validationErrors.name = errors.nameRequired;
  } else if (name.length < 2) {
    validationErrors.name = errors.nameTooShort;
  }

  if (phone.trim().length === 0) {
    validationErrors.phone = errors.phoneRequired;
  } else if (!PHONE_PATTERN.test(phone)) {
    validationErrors.phone = errors.phoneInvalid;
  }

  if (email.trim().length === 0) {
    validationErrors.email = errors.emailRequired;
  } else if (!EMAIL_PATTERN.test(email)) {
    validationErrors.email = errors.emailInvalid;
  }

  if (values.location.length === 0) {
    validationErrors.location = errors.locationRequired;
  }

  if (values.projectType.length === 0) {
    validationErrors.projectType = errors.projectTypeRequired;
  }

  return validationErrors;
}

function FieldShell({ children, error, helper, id, label }: FieldShellProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
      <p className={styles.helper} id={helperId}>
        {helper}
      </p>
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The interactive form stays at a small client boundary. The homepage includes
 * its editorial introduction; inner pages can reuse the same fields and
 * validation without nesting another full section inside their layout.
 */
export function EnquiryForm({ content, variant = 'home' }: EnquiryFormProps) {
  const formId = useId();
  const [values, setValues] = useState<EnquiryValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'succeeded' | 'failed'>(
    'idle',
  );
  /** Set from the server response so the sender has something to quote back. */
  const [reference, setReference] = useState<string | null>(null);
  /** The server's own message, which is more specific than the generic fallback. */
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const validationErrors = validate(values, content.errors);
  const isFormValid = REQUIRED_FIELD_NAMES.every((field) => !validationErrors[field]);
  const isSubmitting = submissionState === 'submitting';
  const hasSucceeded = submissionState === 'succeeded';

  function getVisibleError(field: EnquiryField): string | undefined {
    return touched[field] ? validationErrors[field] : undefined;
  }

  function getFieldDescription(field: EnquiryField, id: string): string {
    const error = getVisibleError(field);
    return error ? `${id}-helper ${id}-error` : `${id}-helper`;
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.currentTarget;

    if (!isEnquiryField(name)) {
      return;
    }

    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setSubmissionState((currentState) => (currentState === 'failed' ? 'idle' : currentState));
  }

  function handleBlur(
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name } = event.currentTarget;

    if (!isEnquiryField(name)) {
      return;
    }

    setTouched((currentTouched) => ({ ...currentTouched, [name]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormValid || isSubmitting) {
      if (!isFormValid) {
        setTouched({ ...ALL_REQUIRED_FIELDS_TOUCHED });
      }
      return;
    }

    setSubmissionState('submitting');
    setSubmissionError(null);

    try {
      const { id } = await submitEnquiry({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        location: values.location,
        projectType: values.projectType,
        message: values.message.trim(),
        source: 'contact-form',
      });
      setReference(id);
      setSubmissionState('succeeded');
    } catch (error) {
      setSubmissionError(
        error instanceof SubmissionError ? error.message : content.errors.submission,
      );
      setSubmissionState('failed');
    }
  }

  const nameId = `${formId}-name`;
  const phoneId = `${formId}-phone`;
  const emailId = `${formId}-email`;
  const locationId = `${formId}-location`;
  const projectTypeId = `${formId}-project-type`;
  const messageId = `${formId}-message`;

  const formContent = hasSucceeded ? (
    <div className={styles.success} role="status" aria-live="polite">
      <h3 className={styles.successTitle}>{content.success.title}</h3>
      <p className={styles.successBody}>{content.success.body}</p>
      {reference ? (
        <p className={styles.successReference}>
          Reference <strong>{reference}</strong>
        </p>
      ) : null}
    </div>
  ) : (
    <form aria-label={content.title} className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <FieldShell
          error={getVisibleError('name')}
          helper={content.helpers.name}
          id={nameId}
          label={content.labels.name}
        >
          <input
            aria-describedby={getFieldDescription('name', nameId)}
            aria-invalid={getVisibleError('name') ? true : undefined}
            autoComplete="name"
            className={styles.control}
            id={nameId}
            minLength={2}
            name="name"
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={content.placeholders.name}
            required
            type="text"
            value={values.name}
          />
        </FieldShell>

        <FieldShell
          error={getVisibleError('phone')}
          helper={content.helpers.phone}
          id={phoneId}
          label={content.labels.phone}
        >
          <input
            aria-describedby={getFieldDescription('phone', phoneId)}
            aria-invalid={getVisibleError('phone') ? true : undefined}
            autoComplete="tel"
            className={styles.control}
            id={phoneId}
            inputMode="numeric"
            name="phone"
            onBlur={handleBlur}
            onChange={handleChange}
            pattern="[6-9][0-9]{9}"
            placeholder={content.placeholders.phone}
            required
            type="tel"
            value={values.phone}
          />
        </FieldShell>

        <FieldShell
          error={getVisibleError('email')}
          helper={content.helpers.email}
          id={emailId}
          label={content.labels.email}
        >
          <input
            aria-describedby={getFieldDescription('email', emailId)}
            aria-invalid={getVisibleError('email') ? true : undefined}
            autoComplete="email"
            className={styles.control}
            id={emailId}
            name="email"
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={content.placeholders.email}
            required
            type="email"
            value={values.email}
          />
        </FieldShell>

        <FieldShell
          error={getVisibleError('location')}
          helper={content.helpers.location}
          id={locationId}
          label={content.labels.location}
        >
          <select
            aria-describedby={getFieldDescription('location', locationId)}
            aria-invalid={getVisibleError('location') ? true : undefined}
            autoComplete="address-level2"
            className={styles.control}
            id={locationId}
            name="location"
            onBlur={handleBlur}
            onChange={handleChange}
            required
            value={values.location}
          >
            <option disabled value="">
              {content.placeholders.location}
            </option>
            {LOCATIONS.map((location) => (
              <option key={location.slug} value={location.name}>
                {location.name}
              </option>
            ))}
            <option value={content.otherLocationLabel}>{content.otherLocationLabel}</option>
          </select>
        </FieldShell>

        <FieldShell
          error={getVisibleError('projectType')}
          helper={content.helpers.projectType}
          id={projectTypeId}
          label={content.labels.projectType}
        >
          <select
            aria-describedby={getFieldDescription('projectType', projectTypeId)}
            aria-invalid={getVisibleError('projectType') ? true : undefined}
            className={styles.control}
            id={projectTypeId}
            name="projectType"
            onBlur={handleBlur}
            onChange={handleChange}
            required
            value={values.projectType}
          >
            <option disabled value="">
              {content.placeholders.projectType}
            </option>
            {content.projectTypes.map((projectType) => (
              <option key={projectType} value={projectType}>
                {projectType}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell
          error={getVisibleError('message')}
          helper={content.helpers.message}
          id={messageId}
          label={content.labels.message}
        >
          <textarea
            aria-describedby={getFieldDescription('message', messageId)}
            aria-invalid={getVisibleError('message') ? true : undefined}
            className={`${styles.control} ${styles.message}`}
            id={messageId}
            name="message"
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={content.placeholders.message}
            rows={5}
            value={values.message}
          />
        </FieldShell>
      </div>

      {submissionState === 'failed' ? (
        <p className={styles.submissionError} role="alert">
          {submissionError ?? content.errors.submission}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button className={styles.submit} disabled={!isFormValid || isSubmitting} type="submit">
          {isSubmitting ? content.submittingLabel : content.submitLabel}
        </Button>
      </div>
    </form>
  );

  if (variant === 'page') {
    return <div className={styles.pageForm}>{formContent}</div>;
  }

  return (
    <Section background="surface" aria-labelledby={`${formId}-title`}>
      <div className={styles.layout}>
        <header className={styles.intro}>
          <SplitHeading as="h2" id={`${formId}-title`}>
            {content.title}
          </SplitHeading>
          <p className={styles.body}>{content.body}</p>
        </header>

        {formContent}
      </div>
    </Section>
  );
}
