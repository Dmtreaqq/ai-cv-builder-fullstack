import { makeContent } from '@/test/fixtures';
import { editorReducer, moveItem, type EditorState } from './editor-reducer';

function initialState(): EditorState {
  return { content: makeContent(), questions: [], highlight: null };
}

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('moveItem', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('swaps an item with its neighbour', () => {
    expect(ids(moveItem(items, 'b', -1))).toEqual(['b', 'a', 'c']);
    expect(ids(moveItem(items, 'b', 1))).toEqual(['a', 'c', 'b']);
  });

  it('returns the same array when the move is out of bounds', () => {
    expect(moveItem(items, 'a', -1)).toBe(items);
    expect(moveItem(items, 'c', 1)).toBe(items);
    expect(moveItem(items, 'missing', 1)).toBe(items);
  });
});

describe('editorReducer', () => {
  it('moves an experience entry down', () => {
    const state = editorReducer(initialState(), {
      type: 'moveEntry',
      section: 'experience',
      entryId: 'exp-acme',
      offset: 1,
    });
    expect(ids(state.content.experience)).toEqual(['exp-northwind', 'exp-acme', 'exp-brightpath']);
  });

  it('moves and removes bullets within one entry', () => {
    let state = editorReducer(initialState(), {
      type: 'moveBullet',
      entryId: 'exp-acme',
      bulletId: 'bullet-acme-mentoring',
      offset: -1,
    });
    state = editorReducer(state, {
      type: 'removeBullet',
      entryId: 'exp-acme',
      bulletId: 'bullet-acme-pipeline',
    });
    expect(ids(state.content.experience[0].bullets)).toEqual([
      'bullet-acme-mentoring',
      'bullet-acme-performance',
    ]);
  });

  it('removes an education entry', () => {
    const state = editorReducer(initialState(), {
      type: 'removeEntry',
      section: 'education',
      entryId: 'edu-tum',
    });
    expect(state.content.education).toEqual([]);
  });

  it('applies only the changed field from the server and highlights it', () => {
    const local = editorReducer(initialState(), {
      type: 'setText',
      ref: { section: 'summary' },
      value: 'Edited locally',
    });
    const server = { ...initialState().content };
    server.contact = { ...server.contact, phone: '+49 151', fullName: 'Server Name' };

    const state = editorReducer(local, {
      type: 'applyChange',
      content: server,
      changed: { section: 'contact', field: 'phone' },
      questions: [],
    });

    expect(state.content.contact.phone).toBe('+49 151');
    expect(state.content.contact.fullName).toBe('Jordan Lee');
    expect(state.content.summary).toBe('Edited locally');
    expect(state.highlight).toBe('contact.phone');
  });
});
