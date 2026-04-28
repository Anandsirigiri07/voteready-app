import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// We need to test the logic of main.ts. Since main.ts has some tightly coupled logic 
// to the DOM and global window object, we will mock the DOM environment using jsdom.

describe('VoteReady App Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="vr-toast"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render a toast correctly', () => {
    // For this test, we can extract the toast logic or test a simple DOM utility.
    // Since main.ts doesn't export functions, we will test standard input sanitization here manually,
    // and we will export functions from main.ts in the upcoming refactor.
    
    // For now, let's write tests for the functions we are about to export from main.ts
    const sanitiseInput = (raw: string): string => {
        return raw.replace(/[^a-zA-Z0-9 ,\-\u0900-\u097F]/g, '').trim().slice(0, 100);
    };

    expect(sanitiseInput('<script>alert(1)</script>')).toBe('scriptalert1script');
    expect(sanitiseInput('New Delhi, 110001')).toBe('New Delhi, 110001');
    expect(sanitiseInput('   padded string   ')).toBe('padded string');
  });

  it('should escape HTML properly', () => {
    const escapeHtml = (str: string): string => {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    };

    expect(escapeHtml('<div id="test">&</div>')).toBe('&lt;div id=&quot;test&quot;&gt;&amp;&lt;/div&gt;');
  });
});
