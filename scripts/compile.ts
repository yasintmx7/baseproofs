
import fs from 'fs';
import path from 'path';
// @ts-ignore
import solc from 'solc';

const CONTRACT_FILENAME = 'BaseProofs.sol';
const CONTRACT_NAME = 'BaseProofs';
const OUTPUT_DIR = 'src';
const OUTPUT_FILE = 'contract.json';

async function main() {
    console.log(`🔨 Compiling ${CONTRACT_FILENAME}...`);
    const contractPath = path.resolve(process.cwd(), CONTRACT_FILENAME);

    if (!fs.existsSync(contractPath)) {
        console.error(`❌ File not found: ${contractPath}`);
        process.exit(1);
    }

    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            [CONTRACT_FILENAME]: {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        const errors = output.errors.filter((e: any) => e.severity === 'error');
        if (errors.length > 0) {
            console.error('❌ Compilation errors:', errors);
            process.exit(1);
        }
    }

    const contract = output.contracts[CONTRACT_FILENAME][CONTRACT_NAME];
    const artifact = {
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
    };

    const outputPath = path.resolve(process.cwd(), OUTPUT_DIR, OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));

    console.log(`✅ Compilation successful!`);
    console.log(`📄 Artifact saved to: ${outputPath}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
