'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  message: string;
  interestedInCollaboration: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function FeedbackForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    interestedInCollaboration: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = 'Message must not exceed 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage("Thank you for your message! I'll get back to you soon.");
        setFormData({
          name: '',
          email: '',
          message: '',
          interestedInCollaboration: false,
        });
        setErrors({});
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Something went wrong. Please try again later.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl" noValidate>
      {/* Name Field */}
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium mb-2 text-ink">
          Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`w-full px-4 py-2 border rounded-md bg-surface-overlay text-ink ${
            errors.name
              ? 'border-danger'
              : 'border-line-strong'
          }`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-danger" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-ink">
          Email <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`w-full px-4 py-2 border rounded-md bg-surface-overlay text-ink ${
            errors.email
              ? 'border-danger'
              : 'border-line-strong'
          }`}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-danger" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div className="mb-6">
        <label htmlFor="message" className="block text-sm font-medium mb-2 text-ink">
          Message <span className="text-danger">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={`w-full px-4 py-2 border rounded-md bg-surface-overlay text-ink ${
            errors.message
              ? 'border-danger'
              : 'border-line-strong'
          }`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-danger" role="alert">
            {errors.message}
          </p>
        )}
        <p className="mt-1 text-sm text-ink-muted">
          {formData.message.length} / 2000 characters
        </p>
      </div>

      {/* Collaboration Checkbox */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.interestedInCollaboration}
            onChange={(e) =>
              setFormData({ ...formData, interestedInCollaboration: e.target.checked })
            }
            className="w-4 h-4 text-accent border-line-strong rounded"
          />
          <span className="ml-2 text-sm text-ink">
            I&apos;m interested in collaboration opportunities
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-6 py-3 rounded-md font-medium transition-colors bg-accent text-ink-inverse ${
          isSubmitting
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-accent-hover'
        }`}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div
          className="mt-4 p-4 bg-surface-overlay border border-success text-ink rounded-md"
          role="status"
        >
          {submitMessage}
        </div>
      )}
      {submitStatus === 'error' && (
        <div
          className="mt-4 p-4 bg-surface-overlay border border-danger text-ink rounded-md"
          role="alert"
        >
          {submitMessage}
        </div>
      )}
    </form>
  );
}

