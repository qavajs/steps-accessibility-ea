import { When } from '@cucumber/cucumber';
import { MemoryValue } from '@qavajs/core';
import * as aChecker from 'accessibility-checker';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

type AccessibilityReport = ReturnType<typeof aChecker.getBaseline> & { details?: any, isFailed: boolean };
type Config = Required<Awaited<ReturnType<typeof aChecker.getConfig>>>;
type SummaryCounts = AccessibilityReport['summary']['counts'];
type World = { config: any, wdio?: any, playwright?: any, attach: (attachment: any, mime: string) => void };

const originalGetConfig = aChecker.getConfig.bind(aChecker);

function summary(summary: SummaryCounts) {
    return Object.entries(summary).map(([k, v]) => `    ${k}: ${v}`).join('\n');
}

const mimeType = {
    html: 'base64:text/html',
    json: 'base64:text/json',
    csv: 'base64:text/csv',
    xlsx: 'base64:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    disable: 'text/plain'
}

async function renderElement(selector: string) {
    // @ts-ignore
    window._QAVAJS_BODY_HTML = window.document.body.innerHTML;
    // @ts-ignore
    window.document.body.innerHTML = window.document.querySelector(selector).outerHTML;
}

async function restoreHtml() {
    // @ts-ignore
    window.document.body.innerHTML = window._QAVAJS_BODY_HTML;
}

async function audit(world: World, options: any = {}) {
    if (!world.wdio && !world.playwright) throw new Error('Browser instance does not exist! Make sure that webdriverio or playwright steps are installed');
    const driver = world.playwright ? world.playwright.page : world.wdio.browser;
    if (options.context) {
        console.log(options.context)
        world.playwright
            ? await world.playwright.page.evaluate(renderElement, options.context)
            : await world.wdio.browser.execute(renderElement, options.context);
    }
    // @ts-ignore
    aChecker.getConfig = async function() {
        const defaultConfig = await originalGetConfig();
        return Object.assign(defaultConfig, options);
    }
    const label = `qavajs-accessibility-${randomUUID()}`;
    const config = await aChecker.getConfig() as Config;
    const { report } = await aChecker.getCompliance(driver, label) as { report: AccessibilityReport };
    if (options.context) {
        world.playwright
            ? await world.playwright.page.evaluate(restoreHtml)
            : await world.wdio.browser.execute(restoreHtml);
    }
    for (const ext of config.outputFormat.filter(format => format !== 'disable')) {
        const file = await readFile(join(process.cwd(), config.outputFolder as string, `${label}.${ext}`));
        world.attach(file.toString('base64'), mimeType[ext]);
    }
    await aChecker.close();
    if (report.details) {
        throw new Error(report.details);
    }
    report.isFailed = config.failLevels.some(failLevel => report.summary.counts[failLevel] > 0);
    return report;
}

/**
 * Perform accessibility check using accessibility-checker library
 * @example
 * When I perform accessibility check
 */
When('I perform accessibility check', async function (this: World) {
    const report = await audit(this);
    if (report.isFailed) {
        throw new Error(`Accessibility check failed!\n${summary(report.summary.counts)}`);
    }
});

/**
 * Perform configure accessibility check using accessibility-checker library
 * Configuration https://github.com/IBMa/equal-access/blob/master/accessibility-checker/src/README.md#configuration
 * @example
 * When I perform accessibility check:
 * """
 * {
 *    "outputFormat": ["html"]
 * }
 * """
 */
When('I perform accessibility check:', async function (this: World, optionsMultiline: string) {
    const options = JSON.parse(optionsMultiline);
    const report = await audit(this, options);
    if (report.isFailed) {
        throw new Error(`Accessibility check failed!\n${summary(report.summary.counts)}`);
    }
});


/**
 * Perform accessibility check using accessibility-checker library and save result to memory variable
 * Results https://github.com/IBMa/equal-access/blob/master/accessibility-checker/src/README.md#async-acheckergetcompliancecontent-label--string
 * @example
 * When I perform accessibility check and save results as 'report'
 * Then I expect '$report.summary.counts.violation' to equal '0'
 */
When('I perform accessibility check and save results as {value}', async function (this: World, memoryKey: MemoryValue) {
    const report = await audit(this);
    memoryKey.set(report);
});

/**
 * Perform configured accessibility check using accessibility-checker library and save result to memory variable
 * Results https://github.com/IBMa/equal-access/blob/master/accessibility-checker/src/README.md#async-acheckergetcompliancecontent-label--string
 * Configuration https://github.com/IBMa/equal-access/blob/master/accessibility-checker/src/README.md#configuration
 * @example
 * When I perform accessibility check and save results as 'report':
 * """
 * {
 *    "outputFormat": ["html"]
 * }
 * """
 * Then I expect '$report.summary.counts.violation' to equal '0'
 */
When('I perform accessibility check and save results as {value}:', async function (this: World, memoryKey: MemoryValue, optionsMultiline: string) {
    const options = JSON.parse(optionsMultiline);
    const report = await audit(this, options);
    memoryKey.set(report);
});