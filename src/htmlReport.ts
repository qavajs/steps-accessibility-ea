type ReportResult = {
    ruleId: string;
    reasonId?: string | number;
    level?: string;
    message: string;
    snippet?: string;
    help?: string;
    ignored?: boolean;
    path?: { [ns: string]: string };
};

type Report = {
    results?: ReportResult[];
    label?: string;
    summary: {
        counts: { [level: string]: number };
        URL?: string;
        scanTime?: number;
        startScan?: number;
        ruleArchive?: string;
        policies?: string[];
    };
};

const levels: Array<{ id: string, title: string, color: string }> = [
    { id: 'violation', title: 'Violation', color: '#da1e28' },
    { id: 'potentialviolation', title: 'Needs review', color: '#ff832b' },
    { id: 'recommendation', title: 'Recommendation', color: '#0f62fe' },
    { id: 'potentialrecommendation', title: 'Potential recommendation', color: '#4589ff' },
    { id: 'manual', title: 'Manual', color: '#8a3ffc' },
    { id: 'pass', title: 'Pass', color: '#24a148' },
];

function escape(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeUrl(url?: string): string | undefined {
    return url && /^https?:\/\//i.test(url) ? url : undefined;
}

function levelOf(id: string) {
    return levels.find(level => level.id === id) ?? { id, title: id, color: '#6f6f6f' };
}

const SNIPPET_LIMIT = 300;

function truncate(value: string, limit: number): string {
    return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

type Group = { ruleId: string, level: string, message: string, help?: string, items: ReportResult[] };

/**
 * Group results by rule and level so shared data (message, help link) is rendered once per group
 */
function groupResults(results: ReportResult[]): Group[] {
    const groups = new Map<string, Group>();
    for (const result of results) {
        const level = result.level ?? 'unknown';
        const key = `${level}\u0000${result.ruleId}`;
        let group = groups.get(key);
        if (!group) {
            group = { ruleId: result.ruleId, level, message: result.message, help: result.help, items: [] };
            groups.set(key, group);
        }
        group.items.push(result);
    }
    return [...groups.values()].sort((a, b) =>
        levels.findIndex(l => l.id === a.level) - levels.findIndex(l => l.id === b.level) || b.items.length - a.items.length
    );
}

function renderItem(result: ReportResult): string {
    const xpath = result.path?.dom;
    return `
    <li>
      ${xpath ? `<code>${escape(xpath)}</code>` : ''}${result.ignored ? ' <span class="ignored">ignored</span>' : ''}
      ${result.path?.aria ? `<div class="aria">ARIA: <code>${escape(result.path.aria)}</code></div>` : ''}
      ${result.snippet ? `<pre>${escape(truncate(result.snippet, SNIPPET_LIMIT))}</pre>` : ''}
    </li>`;
}

function renderGroup(group: Group): string {
    const level = levelOf(group.level);
    const help = safeUrl(group.help);
    const isPass = group.level === 'pass';
    return `
<details class="issue" data-level="${escape(level.id)}">
  <summary>
    <span class="badge" style="background:${level.color}">${escape(level.title)}</span>
    <span class="message">${escape(group.message)}</span>
    <code class="rule">${escape(group.ruleId)}</code>
    <span class="num">${group.items.length}</span>
  </summary>
  <div class="body">
    ${help ? `<div class="row"><a href="${escape(help)}" target="_blank" rel="noopener noreferrer">Learn more about ${escape(group.ruleId)}</a></div>` : ''}
    ${isPass
        ? `<p class="row empty">${group.items.length} element(s) passed. Element details are omitted to keep the report small.</p>`
        : `<ol class="row">${group.items.map(renderItem).join('')}
    </ol>`}
  </div>
</details>`;
}

/**
 * Build self-contained html report from accessibility-checker report object
 * @param report - accessibility-checker report
 * @param failLevels - levels that make check failed
 */
export function htmlReport(report: Report, failLevels: string[] = []): string {
    const counts = report.summary?.counts ?? {};
    const results = report.results ?? [];
    const groups = groupResults(results);
    const isFailed = failLevels.some(level => (counts[level] ?? 0) > 0);
    const url = report.summary?.URL;
    const started = report.summary?.startScan ? new Date(report.summary.startScan).toISOString() : '';
    const presentLevels = levels.filter(level => results.some(result => result.level === level.id));

    const tiles = levels.map(level => `
  <div class="tile" style="border-top-color:${level.color}">
    <div class="count">${escape(counts[level.id] ?? 0)}</div>
    <div class="label">${escape(level.title)}</div>
  </div>`).join('');

    const filters = presentLevels.map(level => `
  <label><input type="checkbox" value="${escape(level.id)}" checked> ${escape(level.title)}</label>`).join('');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility Report</title>
<style>
  :root { --bg:#f4f4f4; --card:#fff; --text:#161616; --muted:#525252; --border:#e0e0e0; --code:#f2f4f8; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#161616; --card:#262626; --text:#f4f4f4; --muted:#a8a8a8; --border:#393939; --code:#1f1f1f; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px; background:var(--bg); color:var(--text); font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  main { max-width:1100px; margin:0 auto; }
  h1 { font-size:22px; margin:0 0 4px; }
  .status { display:inline-block; padding:2px 10px; border-radius:12px; color:#fff; font-weight:600; font-size:12px; vertical-align:middle; margin-left:8px; }
  .meta { color:var(--muted); margin:0 0 20px; word-break:break-all; }
  .meta a { color:inherit; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:20px; }
  .tile { background:var(--card); border:1px solid var(--border); border-top:4px solid; border-radius:6px; padding:12px; }
  .count { font-size:26px; font-weight:600; font-variant-numeric:tabular-nums; }
  .label { color:var(--muted); font-size:12px; }
  .filters { display:flex; flex-wrap:wrap; gap:8px 16px; margin-bottom:12px; }
  .issue { background:var(--card); border:1px solid var(--border); border-radius:6px; margin-bottom:8px; }
  .issue summary { cursor:pointer; padding:10px 12px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .badge { color:#fff; font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; white-space:nowrap; }
  .message { flex:1 1 300px; }
  .rule { color:var(--muted); font-size:12px; }
  .num { font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; border:1px solid var(--border); border-radius:10px; padding:0 8px; }
  ol.row { padding-left:20px; margin-bottom:0; }
  ol.row li { margin-bottom:8px; }
  ol.row pre { margin-top:4px; }
  .aria { color:var(--muted); font-size:12px; }
  .ignored { font-size:11px; color:var(--muted); border:1px solid var(--border); border-radius:10px; padding:0 6px; }
  .body { padding:0 12px 12px; border-top:1px solid var(--border); }
  .row { margin-top:10px; }
  .key { display:block; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-bottom:2px; }
  code, pre { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; word-break:break-all; }
  pre { background:var(--code); padding:8px; border-radius:4px; white-space:pre-wrap; margin:0; }
  a { color:#4589ff; }
  .empty { color:var(--muted); }
</style>
</head>
<body>
<main>
  <h1>Accessibility Report<span class="status" style="background:${isFailed ? '#da1e28' : '#24a148'}">${isFailed ? 'FAILED' : 'PASSED'}</span></h1>
  <p class="meta">
    ${safeUrl(url) ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(url)}</a>` : escape(url)}
    ${started ? ` · ${escape(started)}` : ''}
    ${report.summary?.scanTime !== undefined ? ` · ${escape(report.summary.scanTime)} ms` : ''}
    ${report.summary?.policies?.length ? ` · ${escape(report.summary.policies.join(', '))}` : ''}
    ${report.summary?.ruleArchive ? ` · rule archive: ${escape(report.summary.ruleArchive)}` : ''}
    ${failLevels.length ? ` · fail levels: ${escape(failLevels.join(', '))}` : ''}
  </p>
  <section class="tiles">${tiles}
  </section>
  ${results.length ? `<section class="filters" aria-label="Filter by level">${filters}
  </section>` : ''}
  <section id="issues">
    ${groups.length ? groups.map(renderGroup).join('') : '<p class="empty">No issues reported for selected report levels.</p>'}
  </section>
</main>
<script>
  document.querySelectorAll('.filters input').forEach(function (input) {
    input.addEventListener('change', function () {
      document.querySelectorAll('.issue[data-level="' + input.value + '"]').forEach(function (issue) {
        issue.hidden = !input.checked;
      });
    });
  });
</script>
</body>
</html>`;
}
