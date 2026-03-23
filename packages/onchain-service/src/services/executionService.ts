import {
  redeemDelegationAndTransfer,
  getRemainingAllowance,
  createSubDelegation,
} from "./delegationService.js";
import { logPayout } from "./registryService.js";

export interface PaymentRequest {
  contributorAddress: string;
  amountUsdc: number;
  aiScore: number;
  permissionsContext: string;
  delegationManager?: string;
}

export interface PaymentResult {
  contributorAddress: string;
  amountUsdc: number;
  txHash: string | null;
  error: string | null;
}

/**
 * Execute a batch of contributor payments using ERC-7715 delegations.
 */
export async function executePayments(
  payments: PaymentRequest[]
): Promise<PaymentResult[]> {
  const results: PaymentResult[] = [];

  for (const payment of payments) {
    try {
      // Create sub-delegation scoped to this contributor's amount
      const subContext = await createSubDelegation(
        payment.permissionsContext,
        payment.contributorAddress as `0x${string}`,
        payment.amountUsdc
      );

      // Redeem the delegation to transfer USDC
      // Uses the delegationManager from MetaMask Flask for true delegation redemption
      const txHash = await redeemDelegationAndTransfer(
        subContext,
        payment.contributorAddress as `0x${string}`,
        payment.amountUsdc,
        payment.delegationManager
      );

      // Try to log the payout on-chain in ContributorRegistry (non-blocking)
      try {
        await logPayout(
          payment.contributorAddress as `0x${string}`,
          payment.amountUsdc,
          payment.aiScore,
          txHash as `0x${string}`
        );
      } catch (logErr: any) {
        console.warn(`[ExecutionService] logPayout failed for ${payment.contributorAddress}: ${logErr.message} (non-blocking)`);
      }

      results.push({
        contributorAddress: payment.contributorAddress,
        amountUsdc: payment.amountUsdc,
        txHash,
        error: null,
      });
    } catch (err: any) {
      results.push({
        contributorAddress: payment.contributorAddress,
        amountUsdc: payment.amountUsdc,
        txHash: null,
        error: err.message,
      });
    }
  }

  return results;
}
