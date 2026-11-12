import { describe, expect, test } from 'vitest';
import { htmlReport } from '../src/htmlReport';

const counts = {
    violation: 1,
    potentialviolation: 1,
    recommendation: 0,
    potentialrecommendation: 0,
    manual: 0,
    pass: 1
};

function report(results: any[] = [], summary: any = {}) {
    return {
        results,
        summary: {
            counts,
            URL: 'https://example.com/',
            scanTime: 15,
            startScan: Date.UTC(2026, 0, 1),
            ruleArchive: 'latest',
            policies: ['IBM_Accessibility'],
            ...summary
        }
    };
}

const violation = {
    ruleId: 'img_alt_valid',
    level: 'violation',
    message: 'Image has no <alt>',
    snippet: '<img src="a.png">',
    help: 'https://able.ibm.com/rules/img_alt_valid.html',
    path: { dom: '/html[1]/body[1]/img[1]', aria: '/document[1]/img[1]' }
};

const pass = { ruleId: 'html_lang_valid', level: 'pass', message: 'Lang is valid' };
const review = { ruleId: 'style_color_misuse', level: 'potentialviolation', message: 'Verify color', ignored: true };

describe('htmlReport', () => {
    test('renders summary and metadata', () => {
        const html = htmlReport(report([violation]), ['violation']);
        expect(html).toMatch(/^<!doctype html>/);
        expect(html).toContain('FAILED');
        expect(html).toContain('href="https://example.com/"');
        expect(html).toContain('2026-01-01T00:00:00.000Z');
        expect(html).toContain('15 ms');
        expect(html).toContain('IBM_Accessibility');
        expect(html).toContain('rule archive: latest');
        expect(html).toContain('fail levels: violation');
    });

    test('is passed when fail levels have no issues', () => {
        expect(htmlReport(report(), ['recommendation'])).toContain('PASSED');
        expect(htmlReport(report())).toContain('PASSED');
    });

    test('orders issues by severity', () => {
        const html = htmlReport(report([pass, review, violation]));
        const order = [violation, review, pass].map(r => html.indexOf(`<code class="rule">${r.ruleId}</code>`));
        expect(order.every(i => i > 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
    });

    test('renders issue details', () => {
        const html = htmlReport(report([violation, review]));
        expect(html).toContain('/html[1]/body[1]/img[1]');
        expect(html).toContain('/document[1]/img[1]');
        expect(html).toContain('href="https://able.ibm.com/rules/img_alt_valid.html"');
        expect(html).toContain('<span class="ignored">ignored</span>');
        expect(html).toContain('<input type="checkbox" value="violation" checked>');
        expect(html).not.toContain('value="pass"');
    });

    test('escapes html in report content', () => {
        const html = htmlReport(report([violation]));
        expect(html).toContain('Image has no &lt;alt&gt;');
        expect(html).toContain('&lt;img src=&quot;a.png&quot;&gt;');
        expect(html).not.toContain('<img src="a.png">');
    });

    test('does not render links with unsafe protocols', () => {
        const html = htmlReport(report(
            [{ ...violation, help: 'javascript:alert(1)' }],
            { URL: 'javascript:alert(2)' }
        ));
        expect(html).not.toContain('href="javascript:');
        expect(html).toContain('javascript:alert(2)');
    });

    test('handles empty and minimal report', () => {
        const html = htmlReport({ summary: { counts: {} } } as any);
        expect(html).toContain('No issues reported');
        expect(html).not.toContain('class="filters"');
    });

    test('handles unknown level', () => {
        const html = htmlReport(report([{ ruleId: 'x', message: 'y' }]));
        expect(html).toContain('data-level="unknown"');
    });

    test('renders custom level as is', () => {
        const html = htmlReport(report([{ ruleId: 'x', level: 'custom', message: 'y' }]));
        expect(html).toContain('data-level="custom"');
        expect(html).toContain('<span class="badge" style="background:#6f6f6f">custom</span>');
    });

    test('truncates long snippets', () => {
        const html = htmlReport(report([{ ...violation, snippet: 'a'.repeat(400) }]));
        expect(html).toContain(`<pre>${'a'.repeat(300)}…</pre>`);
        expect(html).not.toContain('a'.repeat(301));
    });

    test('groups results of the same rule and orders groups by size within a level', () => {
        const other = { ...violation, ruleId: 'other_rule' };
        const html = htmlReport(report([other, violation, { ...violation, path: { dom: '/html[1]/body[1]/img[2]' } }]));
        expect(html.match(/<code class="rule">img_alt_valid<\/code>/g)).toHaveLength(1);
        expect(html).toContain('<span class="num">2</span>');
        expect(html.indexOf('<code class="rule">img_alt_valid</code>'))
            .toBeLessThan(html.indexOf('<code class="rule">other_rule</code>'));
    });

    test('handles report without summary', () => {
        const html = htmlReport({ results: [] } as any, ['violation']);
        expect(html).toContain('PASSED');
    });
});
