'use strict';

const { parseExpression } = require('cron-parser');
const { runDailySettlementReconciliation } = require('./settlementReconciliationService');
const logger = require('../utils/logger').child('ReconciliationReportScheduler');

const expression = process.env.RECONCILIATION_CRON || '55 23 * * *';
const MAX_TIMEOUT_MS = 2147483647;
let timer;
let leader = false;

function schedule() {
  const next = parseExpression(expression, { tz: 'UTC' }).next().getTime();
  const delay = Math.max(0, next - Date.now());
  timer = setTimeout(async () => {
    try {
      if (delay <= MAX_TIMEOUT_MS) {
        await runDailySettlementReconciliation({ day: new Date(next).toISOString().slice(0, 10) });
      }
    } catch (err) {
      logger.error('Settlement reconciliation scheduler failed', { error: err.message });
    } finally {
      if (leader) schedule();
    }
  }, Math.min(delay, MAX_TIMEOUT_MS));
  timer.unref?.();
}

function startReconciliationReportScheduler() {
  if (leader) return;
  try {
    schedule();
    leader = true;
    logger.info('Settlement reconciliation scheduled', { expression, timezone: 'UTC' });
  } catch (err) {
    logger.error('Invalid RECONCILIATION_CRON expression', { expression, error: err.message });
  }
}

function stopReconciliationReportScheduler() {
  leader = false;
  clearTimeout(timer);
  timer = undefined;
}

module.exports = { startReconciliationReportScheduler, stopReconciliationReportScheduler };
