const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs').promises;
const mongoose = require('mongoose');
const Problem = require('../models/Problem');

async function importProblems() {
    try {
        // Connect to MongoDB Atlas using your existing database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Read all JSON files from extracted_problems directory
        const problemsDir = path.join(__dirname, '../../extracted_problems');
        const files = await fs.readdir(problemsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        console.log(`Found ${jsonFiles.length} problems to import`);
        let imported = 0;
        let failed = 0;

        // Process each file
        for (const file of jsonFiles) {
            try {
                const filePath = path.join(problemsDir, file);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const problemData = JSON.parse(fileContent);

                // Create new problem - this will automatically create 
                // the 'problems' collection if it doesn't exist
                await Problem.create({
                    ...problemData,
                    addedAt: new Date(),
                    lastUpdated: new Date()
                });
                
                imported++;
                if (imported % 100 === 0) {
                    console.log(`Imported ${imported} problems...`);
                }
            } catch (err) {
                failed++;
                console.error(`Error processing file ${file}:`, err.message);
            }
        }

        console.log('\nImport Summary:');
        console.log(`Total problems found: ${jsonFiles.length}`);
        console.log(`Successfully imported: ${imported}`);
        console.log(`Failed: ${failed}`);

    } catch (err) {
        console.error('Script failed:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB Atlas');
    }
}

// Run the import
console.log('Starting fresh import of problems...');
importProblems();