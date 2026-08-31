'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { SiteLayout } from '@/components/SiteShell';

type FormValues = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  location: string;
  area: string;
  budget: string;
  contactMethod: string;
  brief: string;
};

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  projectType: '',
  location: '',
  area: '',
  budget: '',
  contactMethod: 'Email',
  brief: '',
};

function validateField(name: keyof FormValues, value: string) {
  if (['name', 'email', 'projectType', 'location', 'brief'].includes(name) && !value.trim()) {
    return `Please enter ${name === 'projectType' ? 'a project type' : name === 'brief' ? 'a short project brief' : `your ${name}`}.`;
  }
  if (name === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
    return 'Email needs a complete address, for example name@example.com.';
  }
  if (name === 'phone' && value && value.replace(/\D/g, '').length < 10) {
    return 'Phone number needs at least 10 digits.';
  }
  return '';
}

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const update = (name: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: validateField(name, value) }));
  };

  const validateOnBlur = (name: keyof FormValues) => {
    const message = validateField(name, values[name]);
    setErrors((current) => ({ ...current, [name]: message }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FormValues, string>> = {};
    (Object.keys(values) as Array<keyof FormValues>).forEach((name) => {
      const message = validateField(name, values[name]);
      if (message) nextErrors[name] = message;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const form = event.currentTarget;
      window.requestAnimationFrame(() =>
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
      );
      return;
    }
    setStatus('loading');
    window.setTimeout(() => setStatus('success'), 650);
  };

  return (
    <SiteLayout footerCta="land">
      <PageHero
        eyebrow="LET'S TALK"
        title="Start with a conversation."
        intro="Tell us about your project, your site and what you want to build."
        meta={
          <>
            <span>Project consultation</span>
            <span>Contact details to be confirmed</span>
          </>
        }
      />

      <section className="contact-section section section--paper">
        <div className="shell contact-layout">
          <aside className="contact-aside">
            <p className="eyebrow">Before you write</p>
            <h2>The most useful first note includes four things.</h2>
            <ol>
              <li>
                <span>01</span>
                <p>Where the site is and whether you already own it.</p>
              </li>
              <li>
                <span>02</span>
                <p>Who will use the building and what they need day to day.</p>
              </li>
              <li>
                <span>03</span>
                <p>Your approximate area, budget range, and target timing.</p>
              </li>
              <li>
                <span>04</span>
                <p>The decisions you have already made—and the ones still open.</p>
              </li>
            </ol>
            <div className="contact-aside__direct">
              <span>Prefer a direct note?</span>
              <p>Contact details to be confirmed</p>
            </div>
          </aside>

          {status === 'success' ? (
            <div className="contact-success" role="status">
              <span>
                <Check size={28} aria-hidden="true" />
              </span>
              <p className="eyebrow">Demo success state</p>
              <h2>Your project note is ready for the studio workflow.</h2>
              <p>
                This UI-only build does not transmit form data. Connect this submit handler to the
                existing backend to deliver enquiries.
              </p>
              <button
                type="button"
                className="button button--dark"
                onClick={() => {
                  setValues(initialValues);
                  setStatus('idle');
                }}
              >
                Prepare another enquiry
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={submit} noValidate>
              <div className="contact-form__intro">
                <p className="eyebrow">Project enquiry</p>
                <p>Fields marked * are needed to prepare the first response.</p>
              </div>

              <div className="contact-form__grid">
                <Field
                  label="Your name"
                  name="name"
                  required
                  value={values.name}
                  error={errors.name}
                  onChange={update}
                  onBlur={validateOnBlur}
                  autoComplete="name"
                />
                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  required
                  value={values.email}
                  error={errors.email}
                  onChange={update}
                  onBlur={validateOnBlur}
                  autoComplete="email"
                />
                <Field
                  label="Phone number"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  error={errors.phone}
                  onChange={update}
                  onBlur={validateOnBlur}
                  autoComplete="tel"
                />
                <label className="field">
                  <span>
                    Project type <i aria-hidden="true">*</i>
                  </span>
                  <select
                    required
                    name="projectType"
                    value={values.projectType}
                    onChange={(event) => update('projectType', event.target.value)}
                    onBlur={() => validateOnBlur('projectType')}
                    aria-invalid={Boolean(errors.projectType)}
                    aria-describedby={errors.projectType ? 'projectType-error' : undefined}
                  >
                    <option value="">Choose a project type</option>
                    <option>New residence</option>
                    <option>Residential renovation</option>
                    <option>Interior</option>
                    <option>Workplace or commercial</option>
                    <option>Architecture-only consultation</option>
                  </select>
                  {errors.projectType ? (
                    <small id="projectType-error" className="field__error">
                      {errors.projectType}
                    </small>
                  ) : null}
                </label>
                <Field
                  label="Site location"
                  name="location"
                  required
                  value={values.location}
                  error={errors.location}
                  onChange={update}
                  onBlur={validateOnBlur}
                  autoComplete="address-level2"
                />
                <Field
                  label="Approximate area"
                  name="area"
                  value={values.area}
                  error={errors.area}
                  onChange={update}
                  onBlur={validateOnBlur}
                  placeholder="For example, 2,400 sq.ft"
                />
                <Field
                  label="Approximate budget"
                  name="budget"
                  value={values.budget}
                  error={errors.budget}
                  onChange={update}
                  onBlur={validateOnBlur}
                  placeholder="Share a range if known"
                />
                <fieldset className="contact-method">
                  <legend>Preferred first response</legend>
                  <div>
                    {['Email', 'Phone', 'WhatsApp'].map((method) => (
                      <label key={method}>
                        <input
                          type="radio"
                          name="contactMethod"
                          value={method}
                          checked={values.contactMethod === method}
                          onChange={(event) => update('contactMethod', event.target.value)}
                        />
                        <span>{method}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <label className="field field--full">
                <span>
                  What should the project make possible? <i aria-hidden="true">*</i>
                </span>
                <textarea
                  required
                  name="brief"
                  rows={7}
                  value={values.brief}
                  onChange={(event) => update('brief', event.target.value)}
                  onBlur={() => validateOnBlur('brief')}
                  aria-invalid={Boolean(errors.brief)}
                  aria-describedby={errors.brief ? 'brief-error' : 'brief-help'}
                  placeholder="Tell us about the people, site, priorities, timing, and decisions still open."
                />
                <small id="brief-help">
                  Please do not include sensitive personal or financial documents.
                </small>
                {errors.brief ? (
                  <small id="brief-error" className="field__error">
                    {errors.brief}
                  </small>
                ) : null}
              </label>

              <div className="contact-form__submit">
                <p>
                  UI demonstration: this form currently validates locally and does not send data.
                </p>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Preparing consultation…' : 'Book consultation'}
                  {status !== 'loading' ? <ArrowUpRight size={16} aria-hidden="true" /> : null}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  onBlur,
  required = false,
  type = 'text',
  ...inputProps
}: {
  label: string;
  name: keyof FormValues;
  value: string;
  error?: string | undefined;
  onChange: (name: keyof FormValues, value: string) => void;
  onBlur: (name: keyof FormValues) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <label className="field">
      <span>
        {label} {required ? <i aria-hidden="true">*</i> : null}
      </span>
      <input
        {...inputProps}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        onBlur={() => onBlur(name)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <small id={errorId} className="field__error">
          {error}
        </small>
      ) : null}
    </label>
  );
}
