import { Document, Font, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { CvContent } from '@/features/cvs/cv-types';
import type { PdfColors } from './pdf-colors';

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
  ],
});
Font.register({
  family: 'Source Serif 4',
  fonts: [
    { src: '/fonts/SourceSerif4-Light.ttf', fontWeight: 300 },
    { src: '/fonts/SourceSerif4-SemiBold.ttf', fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingVertical: 48,
    paddingHorizontal: 52,
    fontFamily: 'Inter',
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  name: { fontFamily: 'Source Serif 4', fontWeight: 300, fontSize: 26, lineHeight: 1.1 },
  headline: { marginTop: 6, fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  contact: { marginTop: 6, fontSize: 8.5 },
  rule: { marginTop: 14, borderBottomWidth: 0.75 },
  section: { marginTop: 16 },
  sectionTitle: {
    marginBottom: 6,
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  entry: { marginBottom: 9 },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  entryTitle: { flex: 1 },
  strong: { fontWeight: 600 },
  bullet: { flexDirection: 'row', marginTop: 2.5, paddingLeft: 2 },
  bulletMark: { width: 10 },
  bulletText: { flex: 1 },
  skills: { flexDirection: 'row', flexWrap: 'wrap' },
  skill: { marginRight: 5 },
});

function dateRange(start: string, end: string) {
  return [start, end].filter(Boolean).join(' – ');
}

function href(url: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
}

interface CvDocumentProps {
  content: CvContent;
  colors: PdfColors;
}

export function CvDocument({ content, colors }: CvDocumentProps) {
  const { contact, summary, experience, education, skills } = content;
  const plainContact = [contact.email, contact.phone, contact.location].filter(Boolean);
  const links = contact.links.filter((link) => link.url || link.label);
  const muted = { color: colors.muted };

  function section(title: string, children: ReactNode) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle} minPresenceAhead={40}>
          {title}
        </Text>
        {children}
      </View>
    );
  }

  return (
    <Document
      title={[contact.fullName, contact.headline].filter(Boolean).join(' – ') || 'CV'}
      author={contact.fullName}
      creator="AI CV Builder"
    >
      <Page size="A4" style={[styles.page, { color: colors.ink }]}>
        <Text style={styles.name}>{contact.fullName || 'Your name'}</Text>
        {contact.headline && (
          <Text style={[styles.headline, { color: colors.brand }]}>{contact.headline}</Text>
        )}
        {(plainContact.length > 0 || links.length > 0) && (
          <Text style={[styles.contact, muted]}>
            {plainContact.join('  ·  ')}
            {links.map((link, index) => (
              <Text key={link.id}>
                {plainContact.length > 0 || index > 0 ? '  ·  ' : ''}
                {link.url ? (
                  <Link
                    src={href(link.url)}
                    style={{ color: colors.muted, textDecoration: 'none' }}
                  >
                    {link.url}
                  </Link>
                ) : (
                  link.label
                )}
              </Text>
            ))}
          </Text>
        )}
        <View style={[styles.rule, { borderBottomColor: colors.rule }]} />

        {summary && section('Profile', <Text>{summary}</Text>)}

        {experience.length > 0 &&
          section(
            'Experience',
            experience.map((entry) => (
              <View key={entry.id} style={styles.entry}>
                <View style={styles.entryHead} wrap={false}>
                  <Text style={styles.entryTitle}>
                    <Text style={styles.strong}>{entry.role}</Text>
                    {entry.role && entry.company ? ', ' : ''}
                    {entry.company}
                  </Text>
                  <Text style={muted}>{dateRange(entry.start, entry.end)}</Text>
                </View>
                {entry.location && <Text style={muted}>{entry.location}</Text>}
                {entry.bullets
                  .filter((bullet) => bullet.text)
                  .map((bullet) => (
                    <View key={bullet.id} style={styles.bullet} wrap={false}>
                      <Text style={[styles.bulletMark, { color: colors.brand }]}>•</Text>
                      <Text style={styles.bulletText}>{bullet.text}</Text>
                    </View>
                  ))}
              </View>
            )),
          )}

        {education.length > 0 &&
          section(
            'Education',
            education.map((entry) => (
              <View key={entry.id} style={styles.entry} wrap={false}>
                <View style={styles.entryHead}>
                  <Text style={styles.entryTitle}>
                    <Text style={styles.strong}>{entry.degree}</Text>
                    {entry.degree && entry.school ? ', ' : ''}
                    {entry.school}
                  </Text>
                  <Text style={muted}>{dateRange(entry.start, entry.end)}</Text>
                </View>
                {entry.details && <Text style={muted}>{entry.details}</Text>}
              </View>
            )),
          )}

        {skills.length > 0 &&
          section(
            'Skills',
            <View style={styles.skills}>
              {skills.map((skill, index) => (
                <Text key={skill.id} style={styles.skill}>
                  {skill.name}
                  {index < skills.length - 1 && <Text style={muted}> ·</Text>}
                </Text>
              ))}
            </View>,
          )}
      </Page>
    </Document>
  );
}
