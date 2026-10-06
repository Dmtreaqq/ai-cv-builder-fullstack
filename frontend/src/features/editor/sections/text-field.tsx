import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FieldRef } from '@/features/cvs/cv-types';
import { fieldKey, readText } from '@/features/cvs/field-ref';
import { cn } from '@/lib/utils';
import { HIGHLIGHT_CLASSES } from '../highlight-classes';
import { useEditor } from '../use-editor';

interface TextFieldProps {
  label: string;
  fieldRef: FieldRef;
  multiline?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  className?: string;
}

export function TextField({
  label,
  fieldRef,
  multiline = false,
  hideLabel = false,
  placeholder,
  type = 'text',
  className,
}: TextFieldProps) {
  const { content, highlight, dispatch } = useEditor();
  const key = fieldKey(fieldRef);
  const id = `field-${key.replace(/\./g, '-')}`;
  const value = readText(content, fieldRef) ?? '';
  const highlighted = highlight === key;
  const control = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (highlighted) {
      control.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }
  }, [highlighted]);

  const controlProps = {
    id,
    ref: control,
    value,
    placeholder,
    onChange: (event: { target: { value: string } }) =>
      dispatch({ type: 'setText', ref: fieldRef, value: event.target.value }),
    className: cn(
      'bg-background/40 transition-[color,box-shadow,background-color,border-color] duration-500',
      highlighted && HIGHLIGHT_CLASSES,
    ),
  };

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id} className={cn(hideLabel && 'sr-only')}>
        {label}
      </Label>
      {multiline ? (
        <Textarea {...controlProps} rows={2} />
      ) : (
        <Input {...controlProps} type={type} />
      )}
    </div>
  );
}
