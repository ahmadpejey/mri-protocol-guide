DROP TABLE IF EXISTS Groups;
DROP TABLE IF EXISTS Protocols;
DROP TABLE IF EXISTS Sequences;
DROP TABLE IF EXISTS GlobalDefaults;

CREATE TABLE Groups (GroupID TEXT PRIMARY KEY, GroupName TEXT, GroupOrder INTEGER DEFAULT 0);
CREATE TABLE Protocols (ProtocolID TEXT PRIMARY KEY, GroupID TEXT, ProtocolName TEXT, ProtocolOrder INTEGER DEFAULT 0);
CREATE TABLE Sequences (SeqID TEXT PRIMARY KEY, ProtocolID TEXT, SeqOrder INTEGER DEFAULT 0, Name TEXT, PlanImageURL TEXT, Notes TEXT, Parameters TEXT);
CREATE TABLE GlobalDefaults (RuleID TEXT PRIMARY KEY, Keyword TEXT, DefaultTR TEXT, DefaultTE TEXT);

INSERT INTO GlobalDefaults (RuleID, Keyword, DefaultTR, DefaultTE) VALUES 
('R1', 'T1', '400 - 600', '10 - 20'),
('R2', 'T2', '3000 - 5000', '80 - 120'),
('R3', 'FLAIR', '8000 - 9000', '100 - 140'),
('R4', 'DWI', '4000 - 6000', '70 - 100');