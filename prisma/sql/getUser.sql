SELECT e.payroll, e.name, e.position, d.name as dept, e.location, e.email FROM employee e
LEFT JOIN dept d ON e.department = d.dept_code
WHERE e.payroll = ?
ORDER BY ? ?