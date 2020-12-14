ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'test99rootpasses';
CREATE USER 'nodejs_server'@'%' IDENTIFIED WITH mysql_native_password BY 'test99passes';
/*creating user works, though only with @'localhost'.
-Thats because nodejs_server user was already created through environment variables 
Connecting with it gives same authentication issue?
-Because it connects to non altered user without legacy authentication,
-Also would only be able to connect from localhost*/
GRANT SELECT, UPDATE, INSERT, DELETE ON website_data.* TO 'nodejs_server'@'%';

FLUSH PRIVILEGES;