import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Jeśli nie określono ról (tylko weryfikacja logowania), przepuść
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Sprawdź czy użytkownik ma wymaganą rolę
  if (!allowedRoles.includes(user.role)) {
    // Brak dostępu – przekieruj na stronę domyślną zależnie od jego roli
    if (user.role === 'operator') {
      return <Navigate to="/operator" replace />;
    } else if (user.role === 'superadmin') {
      return <Navigate to="/manager/system_admin/superadmin" replace />;
    } else {
      return <Navigate to="/manager/home/home" replace />;
    }
  }

  return children;
}

ProtectedRoute.propTypes = {
  user: PropTypes.object,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
};
