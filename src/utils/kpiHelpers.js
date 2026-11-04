import { safeParseDate } from './dateHelpers';
import { TICKET_STATUS } from './constants';

export const calculateKPIs = (tickets) => {
  let mttrSum = 0;
  let closedCount = 0;
  let mtbfSum = 0;
  let mttfSum = 0;

  // Grupujemy awarie po maszynach by obliczyć czas między awariami (MTBF)
  const machineIncidents = {};

  tickets.forEach(ticket => {
    // MTTR (Tylko zakończone)
    if (ticket.status === TICKET_STATUS.CLOSED || ticket.status === 6) {
      if ((ticket.workStartedAt || ticket.inProgressAt || ticket.startedAt || ticket.createdAt) && ticket.closedAt) {
        const start =
          safeParseDate(ticket.workStartedAt) ||
          safeParseDate(ticket.inProgressAt) ||
          safeParseDate(ticket.startedAt) ||
          safeParseDate(ticket.createdAt);
        const end = safeParseDate(ticket.closedAt);
        if (start && end && end >= start) {
          mttrSum += (end - start);
          closedCount++;
        }
      }
    }

    // Zbieramy do MTBF (potrzebujemy dat awarii dla każdej maszyny)
    if (ticket.machineId && ticket.createdAt) {
      if (!machineIncidents[ticket.machineId]) {
        machineIncidents[ticket.machineId] = [];
      }
      machineIncidents[ticket.machineId].push(safeParseDate(ticket.createdAt));
    }
  });

  const avgMttrMs = closedCount > 0 ? mttrSum / closedCount : 0;
  const mttrHours = avgMttrMs / (1000 * 60 * 60);

  let machinesWithMultipleIncidents = 0;

  Object.values(machineIncidents).forEach(dates => {
    if (dates.length > 1) {
      dates.sort((a, b) => a - b);
      let diffSum = 0;
      for (let i = 1; i < dates.length; i++) {
        diffSum += (dates[i] - dates[i - 1]);
      }
      mtbfSum += (diffSum / (dates.length - 1));
      machinesWithMultipleIncidents++;
    }
    if (dates.length > 0) {
      mttfSum += 0;
    }
  });

  const mtbfMs = machinesWithMultipleIncidents > 0 ? mtbfSum / machinesWithMultipleIncidents : 0;
  const mtbfDays = mtbfMs / (1000 * 60 * 60 * 24);

  return {
    mttrHours: mttrHours.toFixed(1),
    mtbfDays: mtbfDays.toFixed(1),
    mttfDays: 0,
    totalIncidents: tickets.length,
    closedIncidents: closedCount,
    openIncidents: tickets.length - closedCount
  };
};
