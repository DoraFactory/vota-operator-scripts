import { CommandModule } from "yargs";

import start_voting from "./start_voting";
import stop_voting from "./stop_voting";
import start_process from "./start_process";
import process_message from "./process_message";
import stop_processing from "./stop_processing";
import process_tally from "./process_tally";
import stop_tallying from "./stop_tallying";
import set_round_info from "./set_round_info";
import query_max_vote_options from "./query_max_vote_options";
import tally from "./tally";
import get_result from "./get_result";
import get_all_result from "./get_all_result";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Each command has different options
export const commands: CommandModule<any, any>[] = [
  start_voting,
  stop_voting,
  start_process,
  process_message,
  stop_processing,
  process_tally,
  stop_tallying,
  set_round_info,
  query_max_vote_options,
  tally,
  get_result,
  get_all_result,
];
