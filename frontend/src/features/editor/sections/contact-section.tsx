import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createId } from '@/lib/create-id';
import { useEditor } from '../use-editor';
import { SectionCard } from './section-card';
import { TextField } from './text-field';

export function ContactSection() {
  const { content, dispatch } = useEditor();
  const { links } = content.contact;

  return (
    <SectionCard id="contact" title="Contact">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Full name" fieldRef={{ section: 'contact', field: 'fullName' }} />
        <TextField label="Headline" fieldRef={{ section: 'contact', field: 'headline' }} />
        <TextField label="Email" type="email" fieldRef={{ section: 'contact', field: 'email' }} />
        <TextField label="Phone" type="tel" fieldRef={{ section: 'contact', field: 'phone' }} />
        <TextField
          className="sm:col-span-2"
          label="Location"
          placeholder="City, Country"
          fieldRef={{ section: 'contact', field: 'location' }}
        />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Links</p>
        {links.map((link, index) => (
          <div key={link.id} className="flex items-end gap-2">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`link-label-${link.id}`} className="text-xs text-muted-foreground">
                  Label
                </Label>
                <Input
                  id={`link-label-${link.id}`}
                  value={link.label}
                  placeholder="e.g. Portfolio"
                  className="bg-background/40"
                  onChange={(event) =>
                    dispatch({
                      type: 'setLink',
                      linkId: link.id,
                      field: 'label',
                      value: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`link-url-${link.id}`} className="text-xs text-muted-foreground">
                  URL
                </Label>
                <Input
                  id={`link-url-${link.id}`}
                  value={link.url}
                  placeholder="example.com"
                  className="bg-background/40"
                  onChange={(event) =>
                    dispatch({
                      type: 'setLink',
                      linkId: link.id,
                      field: 'url',
                      value: event.target.value,
                    })
                  }
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove link ${link.label || index + 1}`}
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={() => dispatch({ type: 'removeLink', linkId: link.id })}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => dispatch({ type: 'addLink', id: createId() })}
        >
          <Plus data-icon="inline-start" />
          Add link
        </Button>
      </div>
    </SectionCard>
  );
}
