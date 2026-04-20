import { ClientApplication } from '@merinaa/client';
import { {{MODULE_PASCAL}}ClientController } from './{{MODULE_NAME}}.client';

ClientApplication.getInstance().registerController({{MODULE_PASCAL}}ClientController);
