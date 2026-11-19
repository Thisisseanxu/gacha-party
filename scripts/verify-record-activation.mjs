// Read-only live check using the ID visible in the Android helper. Credentials
// remain in memory; an ephemeral signing key avoids issuing production licenses.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { createRecordActivationHandler } from '../cloud-functions/api/record-activate.js'
import { decodeRecordId } from '../cloud-functions/_shared/record-activation.js'
import { verifyLicenseForEdgeOne } from '../edge-functions/_shared/gacha-records.js'

try {
  const ui = execFileSync('adb', ['-s', 'emulator-5554', 'exec-out', 'uiautomator', 'dump', '/dev/tty'], {
    encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024,
  })
  let recordId = ui.match(/text="(MHPD1\.[A-Za-z0-9_-]+)"/)?.[1]
  if (!recordId) {
    const parcel = execFileSync('adb', ['-s', 'emulator-5554', 'shell', 'service', 'call', 'clipboard', '3', 's16', 'com.android.shell'], {
      encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024,
    })
    const words = [...parcel.matchAll(/^\s*0x[0-9a-f]+:\s*((?:[0-9a-f]{8}\s+){1,4})/gim)]
      .flatMap(match => match[1].trim().split(/\s+/))
    const bytes = Buffer.alloc(words.length * 4)
    words.forEach((word, index) => bytes.writeUInt32LE(Number.parseInt(word, 16), index * 4))
    recordId = bytes.toString('utf16le').match(/MHPD1\.[A-Za-z0-9_-]+/)?.[0]
  }
  assert.ok(recordId, 'Android helper must display the record ID')
  const { playerId } = decodeRecordId(recordId)
  const pair = generateKeyPairSync('ed25519')
  const env = {
    PRIVATE_KEY: pair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
    PUBLIC_KEY: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
  }
  const before = Math.floor(Date.now() / 1000)
  const response = await createRecordActivationHandler()({ request: new Request('https://example.test/api/record-activate', {
    method: 'POST', body: JSON.stringify({ record_id: recordId }),
  }), env })
  assert.equal(response.status, 200, `Cloud Function returned ${response.status}`)
  const result = await response.json()
  assert.equal(String(verifyLicenseForEdgeOne(result.activation_key, env.PUBLIC_KEY).userId), playerId)
  assert.ok(result.expires_at >= before + 864000 && result.expires_at <= Math.floor(Date.now() / 1000) + 864000)
  assert.equal(Buffer.from(result.activation_key, 'base64url').length, 76)
  console.log(JSON.stringify({ playerId, officialRecordUidMatched: true, cloudFunctionStatus: response.status,
    licenseLifetimeDays: 10, legacySignatureVerified: true, signingKey: 'ephemeral-local', cloudArchiveWrites: 0 }, null, 2))
} catch {
  console.error('Live verification failed. Display a current record ID in the Android helper and retry; no credentials were logged.')
  // eslint-disable-next-line no-undef
  process.exitCode = 1
}
