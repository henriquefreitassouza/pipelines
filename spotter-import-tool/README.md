# Spotter Import Tool

This is a small utility to upload data to Spotter in small batches. The program does the following:

- Read from a file a list of companies to be inserted into Spotter;
- Call Spotter API once per company, twice per second at most, sending the name of the company to be inserted;
- Call Spotter API once per contact, twice per second at most, sending the ID and the previously obtained organizationId to be associated with one another.