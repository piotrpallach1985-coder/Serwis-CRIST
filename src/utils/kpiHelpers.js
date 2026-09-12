import { safeParseDate } from './dateHelpers';
import { TICKET_STATUS } from './constants';

export const calculateKPIs = (tickets) => {
  let mttrSum = 0;
  let closedCount = 0;
  let mtbfSum = 0;
  let mttfSum = 0;

  // Grupujemy awarie po maszynach by obliczy czas midzy awariami (MTBF)
  const machineIncidents = {};

  tickets.forEach(ticket => {
    // MTTR (Tylko zakoczone i odrzucone)
    if (ticket.status === TICKET_STATUS.CLOSED || ticket.status === 6) {
      if (ticket.createdAt && ticket.closedAt) {
        const start = safeParseDate(ticket.createdAt);
        const end = safeParseDate(ticket.closedAt);
        if (start && end) {
          mttrSum += (end - start);
          closedCount++;
        }
      }
    }

    // Zbieramy do MTBF (potrzebujemy dat awarii dla kadej maszyny)
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
    // MTTF - czas pierwszej awarii od uruchomienia/poprzedniego (uproszczone: tak samo jak MTBF dla potrzeb demo)
    if (dates.length > 0) {
      mttfSum += 0; // W prawdziwym CMMS potrzebujemy daty instalacji
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

