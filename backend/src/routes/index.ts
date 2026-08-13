import { Router } from 'express';
import { authRouter } from './auth.routes';
import { roleRouter } from './role.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter());
apiRouter.use('/roles', roleRouter());

export { apiRouter };
